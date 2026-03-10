'use client';

import { useEffect, useState, use, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Editor } from '@monaco-editor/react';
import { ArrowLeft, ExternalLink, Save, Loader2, Code2, BookOpen, Trash, LayoutPanelLeft, GripVertical, Minus, Plus, Clock, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { apiFetch } from '@/lib/apiClient';
import { motion } from 'framer-motion';

const RichNotesEditor = lazy(() => import('@/components/RichNotesEditor'));

const difficultyConfig: Record<string, { label: string; dot: string; bg: string }> = {
    easy: { label: 'Easy', dot: 'bg-green-500', bg: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    medium: { label: 'Medium', dot: 'bg-yellow-500', bg: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    hard: { label: 'Hard', dot: 'bg-red-500', bg: 'bg-red-500/10 text-red-600 dark:text-red-400' },
};

const languageOptions = [
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JS' },
    { value: 'typescript', label: 'TS' },
    { value: 'go', label: 'Go' },
];

interface Problem {
    _id: string;
    title: string;
    link: string;
    difficulty: string;
    platform: string;
    categories: string[];
    code: string;
    language: string;
    notes: string;
    updatedAt?: string;
}

export default function ProblemDetail({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const { resolvedTheme } = useTheme();

    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [code, setCode] = useState('');
    const [notes, setNotes] = useState('');
    const [language, setLanguage] = useState('cpp');
    const [fontSize, setFontSize] = useState(14);

    const [activeTab, setActiveTab] = useState<'notes' | 'problem'>('notes');
    const [problemHtml, setProblemHtml] = useState<string | null>(null);
    const [fetchingHtml, setFetchingHtml] = useState(false);

    useEffect(() => {
        const savedFontSize = localStorage.getItem('loop-font-size');
        if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));
    }, []);

    const handleFontSizeChange = (updater: (prev: number) => number) => {
        setFontSize((prev) => {
            const next = updater(prev);
            localStorage.setItem('loop-font-size', next.toString());
            return next;
        });
    };

    useEffect(() => {
        async function fetchProblem() {
            try {
                const res = await apiFetch(`/api/problems/${unwrappedParams.id}`);
                const json = await res.json();
                if (json.success) {
                    setProblem(json.data);
                    setCode(json.data.code || '// Write your solution here...');
                    setNotes(json.data.notes || '');
                    setLanguage(json.data.language || 'cpp');
                } else {
                    router.push('/');
                }
            } catch (err) {
                console.error('Failed to fetch problem', err);
            } finally {
                setLoading(false);
            }
        }
        fetchProblem();
    }, [unwrappedParams.id, router]);

    useEffect(() => {
        async function fetchExternalProblem() {
            if (activeTab === 'problem' && !problemHtml) {
                if (problem?.platform === 'leetcode' || problem?.platform === 'gfg') {
                    setFetchingHtml(true);
                    try {
                        const res = await fetch('/api/fetch-desc', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ link: problem.link, platform: problem.platform })
                        });
                        const json = await res.json();
                        if (json.success) {
                            setProblemHtml(`<h1>${json.title}</h1>\n${json.content}`);
                        } else {
                            setProblemHtml('<div class="text-muted-foreground p-4">Could not load problem. Use the external link button.</div>');
                        }
                    } catch {
                        setProblemHtml('<div class="text-red-500 p-4">Failed to fetch. Use the external link button.</div>');
                    } finally {
                        setFetchingHtml(false);
                    }
                }
            } else if (activeTab === 'problem' && problem?.platform !== 'leetcode' && problem?.platform !== 'gfg') {
                setProblemHtml(`<div class="text-muted-foreground p-4">Native view supported for LeetCode & GFG only. Use the external link button.</div>`);
            }
        }
        fetchExternalProblem();
    }, [activeTab, problem, problemHtml]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch(`/api/problems/${unwrappedParams.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, notes, language }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Error saving', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this problem?')) return;
        try {
            await apiFetch(`/api/problems/${unwrappedParams.id}`, { method: 'DELETE' });
            router.push('/');
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    // Keyboard shortcut: Ctrl/Cmd + S
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    if (loading) {
        return (
            <div className="flex bg-background h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!problem) return null;

    const diff = difficultyConfig[problem.difficulty] || difficultyConfig.easy;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col h-[calc(100vh-2rem)] gap-3"
        >
            {/* ── Top Bar ── */}
            <div className="shrink-0 flex items-center justify-between">
                {/* Left: Back + Info */}
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href="/"
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <ArrowLeft className="w-4.5 h-4.5" />
                    </Link>

                    <div className="min-w-0">
                        <h1 className="text-lg font-bold tracking-tight truncate">{problem.title}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            {/* Difficulty badge */}
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${diff.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                                {diff.label}
                            </span>
                            {/* Platform */}
                            <span className="text-xs text-muted-foreground font-medium capitalize">{problem.platform}</span>
                            {/* Categories */}
                            {problem.categories.slice(0, 3).map((cat) => (
                                <span key={cat} className="hidden sm:inline-flex text-xs text-muted-foreground/70 bg-muted px-2 py-0.5 rounded-md capitalize">
                                    {cat}
                                </span>
                            ))}
                            {problem.categories.length > 3 && (
                                <span className="hidden sm:inline-flex text-xs text-muted-foreground/50">+{problem.categories.length - 3}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleDelete}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Delete"
                    >
                        <Trash className="w-4 h-4" />
                    </button>

                    <a
                        href={problem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open original"
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        title="Save (⌘S)"
                        className={`h-9 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                            saved
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : saved ? (
                            <>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Saved
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Split Pane Workspace ── */}
            <div className="flex-1 min-h-0">
                <PanelGroup direction="horizontal" className="gap-1.5" autoSaveId="loop-panel-layout">
                    {/* Left Panel: Notes / Problem */}
                    <Panel defaultSize={45} minSize={25}>
                        <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden">
                            {/* Tab bar */}
                            <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 bg-muted/20">
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'notes'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Notes
                                </button>
                                <button
                                    onClick={() => setActiveTab('problem')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'problem'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    <LayoutPanelLeft className="w-3.5 h-3.5" />
                                    Problem
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 relative overflow-hidden">
                                {activeTab === 'notes' ? (
                                    <div className="absolute inset-0">
                                        <Suspense fallback={
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                            </div>
                                        }>
                                            <RichNotesEditor content={notes} onChange={setNotes} />
                                        </Suspense>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 p-5 overflow-auto">
                                        {fetchingHtml ? (
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-foreground prose-img:rounded-xl"
                                                dangerouslySetInnerHTML={{ __html: problemHtml || '' }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1.5 rounded-full cursor-col-resize flex items-center justify-center hover:bg-primary/10 transition-colors group">
                        <GripVertical className="w-3.5 h-3.5 text-border group-hover:text-primary/50 transition-colors" />
                    </PanelResizeHandle>

                    {/* Right Panel: Code Editor */}
                    <Panel defaultSize={55} minSize={30}>
                        <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden">
                            {/* Editor toolbar */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
                                <div className="flex items-center gap-1.5">
                                    <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-muted-foreground">Solution</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Font size */}
                                    <div className="flex items-center gap-0.5 bg-background border border-border rounded-lg px-0.5 py-0.5">
                                        <button
                                            onClick={() => handleFontSizeChange(f => Math.max(10, f - 1))}
                                            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-medium w-5 text-center text-muted-foreground">{fontSize}</span>
                                        <button
                                            onClick={() => handleFontSizeChange(f => Math.min(24, f + 1))}
                                            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Language pills */}
                                    <div className="flex items-center gap-1">
                                        {languageOptions.map((l) => (
                                            <button
                                                key={l.value}
                                                onClick={() => setLanguage(l.value)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                                    language === l.value
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                                                }`}
                                            >
                                                {l.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Monaco Editor */}
                            <div className="flex-1 relative">
                                <Editor
                                    height="100%"
                                    language={language.toLowerCase()}
                                    theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                                    value={code}
                                    onChange={(val) => setCode(val || '')}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: fontSize,
                                        padding: { top: 16 },
                                        scrollBeyondLastLine: false,
                                        smoothScrolling: true,
                                        cursorBlinking: 'smooth',
                                        cursorSmoothCaretAnimation: 'on',
                                        formatOnPaste: true,
                                        lineNumbers: 'on',
                                        renderLineHighlight: 'gutter',
                                        folding: true,
                                        bracketPairColorization: { enabled: true },
                                    }}
                                    className="absolute inset-0"
                                />
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        </motion.div>
    );
}
