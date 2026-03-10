'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Link2, Type, Code, StickyNote, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/apiClient';

const difficulties = [
    { value: 'easy', label: 'Easy', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', dot: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-500' },
    { value: 'hard', label: 'Hard', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', dot: 'bg-red-500' },
];

const platforms = [
    { value: 'leetcode', label: 'LeetCode' },
    { value: 'gfg', label: 'GFG' },
    { value: 'codeforces', label: 'Codeforces' },
    { value: 'other', label: 'Other' },
];

const languages = [
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JS' },
    { value: 'typescript', label: 'TS' },
    { value: 'go', label: 'Go' },
];

export default function NewProblem() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [categoryInput, setCategoryInput] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        link: '',
        difficulty: 'easy',
        platform: 'leetcode',
        categories: [] as string[],
        notes: '',
        code: '',
        language: 'cpp',
    });

    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await apiFetch('/api/categories');
                const json = await res.json();
                if (json.success) setAvailableCategories(json.data);
            } catch (err) {
                console.error('Failed to fetch categories', err);
            }
        }
        fetchCategories();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let finalCategories = [...formData.categories];
        if (categoryInput.trim() && !finalCategories.includes(categoryInput.trim().toLowerCase())) {
            finalCategories.push(categoryInput.trim().toLowerCase());
        }

        try {
            const res = await apiFetch('/api/problems', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, categories: finalCategories }),
            });

            if (res.ok) {
                const json = await res.json();
                router.push(`/problems/${json.data._id}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addCategory = (cat: string) => {
        const clean = cat.trim().toLowerCase();
        if (clean && !formData.categories.includes(clean)) {
            setFormData(prev => ({ ...prev, categories: [...prev.categories, clean] }));
        }
        setCategoryInput('');
        setIsDropdownOpen(false);
    };

    const removeCategory = (catToRemove: string) => {
        setFormData(prev => ({ ...prev, categories: prev.categories.filter(c => c !== catToRemove) }));
    };

    const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); addCategory(categoryInput); }
    };

    const filteredSuggestions = availableCategories
        .filter(c => c.toLowerCase().includes(categoryInput.toLowerCase()))
        .filter(c => !formData.categories.includes(c));

    return (
        <div className="h-full flex flex-col">
            {/* Top bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="shrink-0 flex items-center justify-between py-2"
            >
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back
                </Link>
                <span className="text-xs text-muted-foreground/50 tracking-wide uppercase">New Problem</span>
            </motion.div>

            {/* Scrollable form */}
            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1 overflow-y-auto pb-28 scrollbar-hide"
            >
                <div className="max-w-2xl mx-auto space-y-10 pt-4">

                    {/* ── Section 1: Title & Link ── */}
                    <div className="space-y-5">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Type className="w-4 h-4 text-muted-foreground" />
                                <label className="text-sm font-medium">Title</label>
                            </div>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Two Sum"
                                className="w-full h-12 px-4 rounded-2xl border border-border bg-card text-base focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all placeholder:text-muted-foreground/40"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Link2 className="w-4 h-4 text-muted-foreground" />
                                <label className="text-sm font-medium">Problem URL</label>
                            </div>
                            <input
                                required
                                type="url"
                                placeholder="https://leetcode.com/problems/two-sum"
                                className="w-full h-12 px-4 rounded-2xl border border-border bg-card text-base focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all placeholder:text-muted-foreground/40"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-border/60" />

                    {/* ── Section 2: Difficulty ── */}
                    <div>
                        <label className="text-sm font-medium mb-3 block">Difficulty</label>
                        <div className="flex gap-2">
                            {difficulties.map((d) => (
                                <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, difficulty: d.value })}
                                    className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                                        formData.difficulty === d.value
                                            ? `${d.color} border-current scale-[1.02] shadow-sm`
                                            : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${d.dot}`} />
                                        {d.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Section 3: Platform ── */}
                    <div>
                        <label className="text-sm font-medium mb-3 block">Platform</label>
                        <div className="flex gap-2 flex-wrap">
                            {platforms.map((p) => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, platform: p.value })}
                                    className={`px-5 h-10 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ${
                                        formData.platform === p.value
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
                                            : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Section 4: Language ── */}
                    <div>
                        <label className="text-sm font-medium mb-3 block">Language</label>
                        <div className="flex gap-2 flex-wrap">
                            {languages.map((l) => (
                                <button
                                    key={l.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, language: l.value })}
                                    className={`px-5 h-10 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ${
                                        formData.language === l.value
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
                                            : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-border/60" />

                    {/* ── Section 5: Categories ── */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="text-sm font-medium mb-3 block">Topics</label>

                        <div className="min-h-12 w-full px-4 py-2.5 bg-card border border-border rounded-2xl focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent flex flex-wrap gap-2 items-center transition-all">
                            <AnimatePresence>
                                {formData.categories.map((cat) => (
                                    <motion.span
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        key={cat}
                                        className="inline-flex items-center gap-1 bg-primary/10 text-primary pl-2.5 pr-1.5 py-1 rounded-lg text-sm font-medium"
                                    >
                                        <span className="capitalize">{cat}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeCategory(cat)}
                                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                            <input
                                type="text"
                                placeholder={formData.categories.length === 0 ? "e.g. array, dp, graph" : "Add more..."}
                                className="flex-1 min-w-24 bg-transparent outline-none text-sm placeholder:text-muted-foreground/40"
                                value={categoryInput}
                                onChange={(e) => { setCategoryInput(e.target.value); setIsDropdownOpen(true); }}
                                onKeyDown={handleCategoryKeyDown}
                                onFocus={() => setIsDropdownOpen(true)}
                            />
                        </div>

                        {isDropdownOpen && (categoryInput.trim() || filteredSuggestions.length > 0) && (
                            <div className="absolute z-10 w-full mt-2 bg-card border border-border shadow-xl rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                                {categoryInput.trim() && !filteredSuggestions.includes(categoryInput.trim().toLowerCase()) && (
                                    <button
                                        type="button"
                                        onClick={() => addCategory(categoryInput)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted font-medium text-primary transition-colors flex items-center gap-2"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 opacity-50" />
                                        Create &quot;{categoryInput}&quot;
                                    </button>
                                )}
                                {filteredSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => addCategory(suggestion)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors capitalize"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-border/60" />

                    {/* ── Section 6: Code ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Code className="w-4 h-4 text-muted-foreground" />
                            <label className="text-sm font-medium">Solution Code</label>
                            <span className="text-xs text-muted-foreground/50 ml-1">optional</span>
                        </div>
                        <textarea
                            placeholder="Paste your solution here..."
                            className="w-full min-h-48 p-4 rounded-2xl border border-border bg-card font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all placeholder:text-muted-foreground/40 resize-y"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            spellCheck={false}
                        />
                    </div>

                    {/* ── Section 7: Notes ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <StickyNote className="w-4 h-4 text-muted-foreground" />
                            <label className="text-sm font-medium">Notes</label>
                            <span className="text-xs text-muted-foreground/50 ml-1">optional</span>
                        </div>
                        <textarea
                            placeholder="Key intuition, approach, or trick..."
                            className="w-full min-h-28 p-4 rounded-2xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all placeholder:text-muted-foreground/40 resize-y"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>
            </motion.form>

            {/* ── Sticky Bottom CTA ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background via-background to-transparent pt-10"
            >
                <div className="max-w-2xl mx-auto">
                    <button
                        type="submit"
                        form="new-problem-form"
                        disabled={loading}
                        onClick={handleSubmit}
                        className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/10 cursor-pointer"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Save to Loop
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
