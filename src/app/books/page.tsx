'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Plus, BookOpen, Loader2, Trash2, X, Sparkles,
    BookMarked, Library
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiFetch } from '@/lib/apiClient';

interface Book {
    _id: string;
    title: string;
    description: string;
    emoji: string;
    coverGradient: string;
    createdAt: string;
    updatedAt: string;
}

const GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-amber-400 to-orange-500',
    'from-fuchsia-500 to-pink-600',
    'from-sky-400 to-blue-500',
    'from-lime-400 to-green-500',
];

const EMOJIS = ['📘', '📗', '📕', '📙', '🐘', '⚛️', '🌐', '🧠', '🔥', '💡', '🎯', '🚀', '⚡', '🛠️', '📊', '🏗️', '🎨', '🤖', '💻', '🔐'];

export default function BooksPage() {
    const router = useRouter();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newEmoji, setNewEmoji] = useState('📘');
    const [newGradient, setNewGradient] = useState(GRADIENTS[0]);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchBooks();
    }, []);

    async function fetchBooks() {
        const token = localStorage.getItem('dsa-vault-token');
        if (!token) { router.push('/login'); return; }

        try {
            const res = await apiFetch('/api/books');
            const json = await res.json();
            if (json.success) setBooks(json.data);
        } catch (err) {
            console.error('Failed to fetch books', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const res = await apiFetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDescription,
                    emoji: newEmoji,
                    coverGradient: newGradient,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setBooks((prev) => [json.data, ...prev]);
                setShowCreate(false);
                setNewTitle('');
                setNewDescription('');
                setNewEmoji('📘');
                setNewGradient(GRADIENTS[0]);
            }
        } catch (err) {
            console.error('Failed to create book', err);
        } finally {
            setCreating(false);
        }
    }

    async function handleDelete(bookId: string) {
        setDeletingId(bookId);
        try {
            const res = await apiFetch(`/api/books/${bookId}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                setBooks((prev) => prev.filter((b) => b._id !== bookId));
            }
        } catch (err) {
            console.error('Failed to delete book', err);
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <div className="flex bg-background h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Library className="w-8 h-8 text-muted-foreground" />
                        My Books
                    </h1>
                    <p className="text-muted-foreground mt-1">Your personal knowledge library — organize notes into books.</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    New Book
                </button>
            </div>

            {/* Create Book Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                    Create New Book
                                </h2>
                                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Preview Card */}
                            <div className={`relative h-32 rounded-2xl bg-gradient-to-br ${newGradient} overflow-hidden mb-6 flex items-center justify-center`}>
                                <span className="text-5xl drop-shadow-lg">{newEmoji}</span>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent h-16" />
                                <div className="absolute bottom-3 left-4 text-white font-bold text-lg drop-shadow-md truncate pr-4 max-w-[90%]">
                                    {newTitle || 'Book Title'}
                                </div>
                            </div>

                            {/* Emoji Picker */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">Pick an Icon</label>
                                <div className="flex flex-wrap gap-2">
                                    {EMOJIS.map((e) => (
                                        <button
                                            key={e}
                                            onClick={() => setNewEmoji(e)}
                                            className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${newEmoji === e ? 'bg-primary/10 ring-2 ring-primary scale-110' : 'bg-muted/50 hover:bg-muted'}`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gradient Picker */}
                            <div className="mb-5">
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">Cover Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {GRADIENTS.map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setNewGradient(g)}
                                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} transition-all ${newGradient === g ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <input
                                type="text"
                                placeholder="Book title (e.g., PostgreSQL)"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all mb-3"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                            />

                            {/* Description */}
                            <input
                                type="text"
                                placeholder="Short description (optional)"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all mb-5"
                            />

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newTitle.trim() || creating}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                                    Create Book
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {books.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative flex flex-col items-center justify-center py-24 text-center"
                >
                    <motion.div
                        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="mb-6"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg mx-auto">
                                <BookMarked className="w-9 h-9" />
                            </div>
                        </motion.div>
                        <h2 className="text-3xl font-extrabold tracking-tight mb-3">Start Your First Book</h2>
                        <p className="text-muted-foreground text-base max-w-md mx-auto">
                            Create a book to organize your notes into chapters and pages. Like your own developer wiki.
                        </p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-8 group inline-flex items-center gap-2.5 bg-primary text-primary-foreground pl-6 pr-5 py-3.5 rounded-full font-semibold text-base hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Book
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Book Grid (Bookshelf) */}
            {books.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    <AnimatePresence>
                        {books.map((book, i) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.25, delay: i * 0.05 }}
                                key={book._id}
                                className="group relative"
                            >
                                <div
                                    onClick={() => router.push(`/books/${book._id}`)}
                                    className="cursor-pointer bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* Cover */}
                                    <div className={`relative h-36 bg-gradient-to-br ${book.coverGradient} flex items-center justify-center overflow-hidden`}>
                                        <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{book.emoji}</span>
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/30 to-transparent h-12" />
                                    </div>

                                    {/* Details */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-base leading-tight mb-1 truncate group-hover:text-primary transition-colors">
                                            {book.title}
                                        </h3>
                                        {book.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{book.description}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground/60 mt-2">
                                            Updated {formatDistanceToNow(new Date(book.updatedAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(book._id); }}
                                    disabled={deletingId === book._id}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/40 text-white/80 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                    title="Delete Book"
                                >
                                    {deletingId === book._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
