'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, ChevronRight, Plus, Trash2, Loader2,
    FileText, ChevronDown, BookOpen, Pencil, Check, X,
    Maximize2, Minimize2, Save
} from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import RichNotesEditor from '@/components/RichNotesEditor';

interface Book {
    _id: string;
    title: string;
    emoji: string;
    coverGradient: string;
    description: string;
}

interface Chapter {
    _id: string;
    title: string;
    emoji: string;
    order: number;
}

interface Page {
    _id: string;
    title: string;
    emoji: string;
    content: string;
    order: number;
    chapterId: string;
}

export default function BookEditorPage({ params }: { params: Promise<{ bookId: string }> }) {
    const { bookId } = use(params);
    const router = useRouter();

    const [book, setBook] = useState<Book | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [pages, setPages] = useState<Record<string, Page[]>>({});
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [zenMode, setZenMode] = useState(false);

    // Page edit state
    const [pageContent, setPageContent] = useState('');
    const [pageTitle, setPageTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Chapter create
    const [creatingChapter, setCreatingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');

    // Inline rename
    const [renamingChapterId, setRenamingChapterId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [editingPageTitle, setEditingPageTitle] = useState(false);

    // Helper to get display title
    const getDisplayTitle = (title: string, content: string) => {
        if (!title || title.trim() === 'Untitled' || title.trim() === '') {
            if (!content) return 'Untitled';
            const text = content.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
            return text ? text : 'Untitled';
        }
        return title;
    };

    // Load book & chapters
    useEffect(() => {
        async function loadBook() {
            try {
                const [bookRes, chaptersRes] = await Promise.all([
                    apiFetch(`/api/books/${bookId}`),
                    apiFetch(`/api/books/${bookId}/chapters`),
                ]);

                const bookJson = await bookRes.json();
                const chaptersJson = await chaptersRes.json();

                if (bookJson.success) setBook(bookJson.data);
                if (chaptersJson.success) {
                    setChapters(chaptersJson.data);
                    // Auto-expand first chapter
                    if (chaptersJson.data.length > 0) {
                        const first = chaptersJson.data[0];
                        setExpandedChapters(new Set([first._id]));
                        loadPages(first._id);
                    }
                }
            } catch (err) {
                console.error('Failed to load book', err);
            } finally {
                setLoading(false);
            }
        }
        loadBook();
    }, [bookId]);

    async function loadPages(chapterId: string) {
        try {
            const res = await apiFetch(`/api/books/${bookId}/chapters/${chapterId}/pages`);
            const json = await res.json();
            if (json.success) {
                setPages((prev) => ({ ...prev, [chapterId]: json.data }));
            }
        } catch (err) {
            console.error('Failed to load pages', err);
        }
    }

    function toggleChapter(chapterId: string) {
        setExpandedChapters((prev) => {
            const next = new Set(prev);
            if (next.has(chapterId)) {
                next.delete(chapterId);
            } else {
                next.add(chapterId);
                // Load pages if not loaded yet
                if (!pages[chapterId]) {
                    loadPages(chapterId);
                }
            }
            return next;
        });
    }

    // Auto-save
    const autoSave = useCallback(
        (content: string, title: string) => {
            if (!selectedPage) return;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            saveTimeoutRef.current = setTimeout(async () => {
                setSaving(true);
                try {
                    const chapterId = selectedPage.chapterId;
                    await apiFetch(
                        `/api/books/${bookId}/chapters/${chapterId}/pages/${selectedPage._id}`,
                        {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content, title }),
                        }
                    );
                    setLastSaved(new Date());
                    // Update local state
                    setPages((prev) => {
                        const chapterPages = prev[chapterId] || [];
                        return {
                            ...prev,
                            [chapterId]: chapterPages.map((p) =>
                                p._id === selectedPage._id ? { ...p, content, title } : p
                            ),
                        };
                    });
                } catch (err) {
                    console.error('Autosave failed', err);
                } finally {
                    setSaving(false);
                }
            }, 1000);
        },
        [selectedPage, bookId]
    );

    function handleContentChange(html: string) {
        setPageContent(html);
        autoSave(html, pageTitle);
    }

    function handleTitleChange(newTitle: string) {
        setPageTitle(newTitle);
        autoSave(pageContent, newTitle);
    }

    function selectPage(page: Page) {
        setSelectedPage(page);
        setPageContent(page.content);
        setPageTitle(page.title);
        setEditingPageTitle(false);
        setLastSaved(null);
    }

    // Create chapter
    async function handleCreateChapter() {
        if (!newChapterTitle.trim()) return;
        try {
            const res = await apiFetch(`/api/books/${bookId}/chapters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newChapterTitle }),
            });
            const json = await res.json();
            if (json.success) {
                setChapters((prev) => [...prev, json.data]);
                setExpandedChapters((prev) => new Set(prev).add(json.data._id));
                setNewChapterTitle('');
                setCreatingChapter(false);
            }
        } catch (err) {
            console.error('Failed to create chapter', err);
        }
    }

    // Create page
    async function handleCreatePage(chapterId: string) {
        try {
            const res = await apiFetch(
                `/api/books/${bookId}/chapters/${chapterId}/pages`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'Untitled' }),
                }
            );
            const json = await res.json();
            if (json.success) {
                setPages((prev) => ({
                    ...prev,
                    [chapterId]: [...(prev[chapterId] || []), json.data],
                }));
                selectPage(json.data);
            }
        } catch (err) {
            console.error('Failed to create page', err);
        }
    }

    // Delete chapter
    async function handleDeleteChapter(chapterId: string) {
        try {
            await apiFetch(`/api/books/${bookId}/chapters/${chapterId}`, { method: 'DELETE' });
            setChapters((prev) => prev.filter((c) => c._id !== chapterId));
            setPages((prev) => {
                const next = { ...prev };
                delete next[chapterId];
                return next;
            });
            if (selectedPage && selectedPage.chapterId === chapterId) {
                setSelectedPage(null);
            }
        } catch (err) {
            console.error('Failed to delete chapter', err);
        }
    }

    // Delete page
    async function handleDeletePage(page: Page) {
        try {
            await apiFetch(
                `/api/books/${bookId}/chapters/${page.chapterId}/pages/${page._id}`,
                { method: 'DELETE' }
            );
            setPages((prev) => ({
                ...prev,
                [page.chapterId]: (prev[page.chapterId] || []).filter((p) => p._id !== page._id),
            }));
            if (selectedPage?._id === page._id) {
                setSelectedPage(null);
            }
        } catch (err) {
            console.error('Failed to delete page', err);
        }
    }

    // Rename chapter
    async function handleRenameChapter(chapterId: string) {
        if (!renameValue.trim()) { setRenamingChapterId(null); return; }
        try {
            await apiFetch(`/api/books/${bookId}/chapters/${chapterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: renameValue }),
            });
            setChapters((prev) =>
                prev.map((c) => (c._id === chapterId ? { ...c, title: renameValue } : c))
            );
        } catch (err) {
            console.error('Failed to rename', err);
        } finally {
            setRenamingChapterId(null);
        }
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <p className="text-muted-foreground">Book not found</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-2rem)] overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -my-4">
            {/* ══════════════════════════════════════════════════════
                BOOK SIDEBAR
               ══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {sidebarOpen && !zenMode && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="shrink-0 border-r border-border/40 bg-card/30 flex flex-col overflow-hidden"
                    >
                        {/* Book Header */}
                        <div className="p-4 border-b border-border/40">
                            <button
                                onClick={() => router.push('/books')}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-3"
                            >
                                <ChevronLeft className="w-3 h-3" />
                                All Books
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{book.emoji}</span>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-sm truncate">{book.title}</h2>
                                    {book.description && (
                                        <p className="text-xs text-muted-foreground truncate">{book.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Chapters List */}
                        <div className="flex-1 overflow-y-auto p-2 book-sidebar-scroll">
                            {chapters.map((chapter) => (
                                <div key={chapter._id} className="mb-1">
                                    {/* Chapter Row */}
                                    <div className="group flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-muted/50 transition-colors">
                                        <button
                                            onClick={() => toggleChapter(chapter._id)}
                                            className="shrink-0 w-5 h-5 flex items-center justify-center text-muted-foreground"
                                        >
                                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedChapters.has(chapter._id) ? '' : '-rotate-90'}`} />
                                        </button>

                                        {renamingChapterId === chapter._id ? (
                                            <div className="flex-1 flex items-center gap-1">
                                                <input
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleRenameChapter(chapter._id); if (e.key === 'Escape') setRenamingChapterId(null); }}
                                                    className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleRenameChapter(chapter._id)} className="text-green-500 hover:text-green-400"><Check className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setRenamingChapterId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-sm mr-1">{chapter.emoji}</span>
                                                <span
                                                    className="flex-1 text-xs font-medium truncate cursor-pointer"
                                                    onClick={() => toggleChapter(chapter._id)}
                                                >
                                                    {chapter.title}
                                                </span>
                                                <div className="hidden group-hover:flex items-center gap-0.5">
                                                    <button
                                                        onClick={() => handleCreatePage(chapter._id)}
                                                        className="w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                                        title="Add Page"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setRenamingChapterId(chapter._id); setRenameValue(chapter.title); }}
                                                        className="w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                                        title="Rename"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteChapter(chapter._id)}
                                                        className="w-5 h-5 flex items-center justify-center rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Delete Chapter"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Pages */}
                                    <AnimatePresence>
                                        {expandedChapters.has(chapter._id) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-6 space-y-0.5 py-1">
                                                    {(pages[chapter._id] || []).map((page) => (
                                                        <div
                                                            key={page._id}
                                                            className={`group/page flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${
                                                                selectedPage?._id === page._id
                                                                    ? 'bg-primary/10 text-primary font-medium'
                                                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                                            }`}
                                                            onClick={() => selectPage(page)}
                                                        >
                                                            <FileText className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate flex-1">{getDisplayTitle(page.title, page.content)}</span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeletePage(page); }}
                                                                className="hidden group-hover/page:flex w-4 h-4 items-center justify-center rounded text-red-500 hover:text-red-400 transition-colors"
                                                                title="Delete Page"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {(pages[chapter._id] || []).length === 0 && (
                                                        <p className="text-xs text-muted-foreground/50 pl-2 py-1 italic">No pages yet</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            {/* Add Chapter */}
                            {creatingChapter ? (
                                <div className="px-2 py-2">
                                    <input
                                        value={newChapterTitle}
                                        onChange={(e) => setNewChapterTitle(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateChapter(); if (e.key === 'Escape') setCreatingChapter(false); }}
                                        placeholder="Chapter title..."
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={handleCreateChapter} className="flex-1 text-xs py-1 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all">Add</button>
                                        <button onClick={() => setCreatingChapter(false)} className="flex-1 text-xs py-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-all">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setCreatingChapter(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors mt-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Chapter
                                </button>
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════
                MAIN EDITOR AREA
               ══════════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-card/30 shrink-0">
                    <div className="flex items-center gap-2">
                        {!zenMode && (
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                            >
                                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                        )}

                        {selectedPage && (
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                {editingPageTitle ? (
                                    <input
                                        value={pageTitle}
                                        onChange={(e) => { setPageTitle(e.target.value); handleTitleChange(e.target.value); }}
                                        onBlur={() => setEditingPageTitle(false)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingPageTitle(false); }}
                                        className="bg-transparent border-b border-primary text-sm font-medium outline-none min-w-[100px] max-w-[300px]"
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        onClick={() => setEditingPageTitle(true)}
                                        className="text-sm font-medium cursor-pointer hover:text-primary transition-colors truncate max-w-[300px]"
                                        title="Click to rename"
                                    >
                                        {getDisplayTitle(pageTitle, pageContent)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Save Status */}
                        {selectedPage && (
                            <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                                {saving ? (
                                    <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                                ) : lastSaved ? (
                                    <><Save className="w-3 h-3" /> Saved</>
                                ) : null}
                            </span>
                        )}

                        {/* Zen Mode Toggle */}
                        <button
                            onClick={() => setZenMode(!zenMode)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                            title={zenMode ? 'Exit Zen Mode' : 'Zen Mode'}
                        >
                            {zenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto">
                    {selectedPage ? (
                        <div className={`h-full ${zenMode ? 'max-w-3xl mx-auto' : ''}`}>
                            <RichNotesEditor
                                key={selectedPage._id}
                                content={pageContent}
                                onChange={handleContentChange}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
                                    <BookOpen className="w-7 h-7 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Select a page to start writing</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    {chapters.length === 0
                                        ? 'Create a chapter in the sidebar first, then add pages to it.'
                                        : 'Pick a page from the sidebar, or create a new one inside a chapter.'}
                                </p>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
