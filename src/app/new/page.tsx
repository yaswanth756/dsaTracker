'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/apiClient';

export default function NewProblem() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Categories state
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
                if (json.success) {
                    setAvailableCategories(json.data);
                }
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

        // Include any remaining text in category input as a category
        let finalCategories = [...formData.categories];
        if (categoryInput.trim() && !finalCategories.includes(categoryInput.trim().toLowerCase())) {
            finalCategories.push(categoryInput.trim().toLowerCase());
        }

        const dataToSubmit = {
            ...formData,
            categories: finalCategories,
        };

        try {
            const res = await apiFetch('/api/problems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSubmit),
            });

            if (res.ok) {
                const json = await res.json();
                router.push(`/problems/${json.data._id}`);
            } else {
                console.error('Failed to create problem');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addCategory = (cat: string) => {
        const cleanly = cat.trim().toLowerCase();
        if (cleanly && !formData.categories.includes(cleanly)) {
            setFormData(prev => ({ ...prev, categories: [...prev.categories, cleanly] }));
        }
        setCategoryInput('');
        setIsDropdownOpen(false);
    };

    const removeCategory = (catToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c !== catToRemove)
        }));
    };

    const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCategory(categoryInput);
        }
    };

    const filteredSuggestions = availableCategories
        .filter(c => c.toLowerCase().includes(categoryInput.toLowerCase()))
        .filter(c => !formData.categories.includes(c));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full flex flex-col max-w-6xl mx-auto"
        >
            <div className="shrink-0 mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight">Add Problem to Vault</h1>
                    <p className="text-muted-foreground">Save an interesting problem and its insights.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-card border border-border/50 p-6 md:p-8 rounded-3xl shadow-sm overflow-hidden">
                {/* Left Column - Metadata */}
                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium">Problem Title</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Two Sum"
                            className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:outline-none transition-all placeholder:text-muted-foreground/50"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium">Platform URL</label>
                        <input
                            required
                            type="url"
                            placeholder="https://leetcode.com/problems/..."
                            className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:outline-none transition-all placeholder:text-muted-foreground/50"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium">Difficulty</label>
                            <select
                                className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:outline-none transition-all appearance-none cursor-pointer"
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                            >
                                <option value="easy">Easy 🟢</option>
                                <option value="medium">Medium 🟡</option>
                                <option value="hard">Hard 🔴</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium">Platform</label>
                            <select
                                className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:outline-none transition-all appearance-none cursor-pointer capitalize"
                                value={formData.platform}
                                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                            >
                                <option value="leetcode">LeetCode</option>
                                <option value="gfg">GeeksForGeeks</option>
                                <option value="codeforces">Codeforces</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3 relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium">Categories (Type and press Enter)</label>

                        <div className="min-h-[44px] w-full p-2 bg-background border border-input rounded-xl focus-within:ring-2 focus-within:ring-ring flex flex-wrap gap-2 items-center transition-all">
                            <AnimatePresence>
                                {formData.categories.map((cat) => (
                                    <motion.span
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        key={cat}
                                        className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-md text-sm font-medium"
                                    >
                                        {cat}
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
                                placeholder={formData.categories.length === 0 ? "e.g. array, hash table" : ""}
                                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground/50 ml-1"
                                value={categoryInput}
                                onChange={(e) => {
                                    setCategoryInput(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onKeyDown={handleCategoryKeyDown}
                                onFocus={() => setIsDropdownOpen(true)}
                            />
                        </div>

                        {/* Dropdown Suggestions */}
                        {isDropdownOpen && (categoryInput.trim() || filteredSuggestions.length > 0) && (
                            <div className="absolute z-10 w-full mt-1 bg-card border border-border shadow-lg rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                {categoryInput.trim() && !filteredSuggestions.includes(categoryInput.trim().toLowerCase()) && (
                                    <button
                                        type="button"
                                        onClick={() => addCategory(categoryInput)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted font-medium text-primary transition-colors flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4 opacity-50" />
                                        Create "{categoryInput}"
                                    </button>
                                )}
                                {filteredSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => addCategory(suggestion)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors capitalize text-foreground"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                                {filteredSuggestions.length === 0 && !categoryInput.trim() && (
                                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                        Type to create a new category
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium">Language</label>
                        <select
                            className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:outline-none transition-all appearance-none cursor-pointer capitalize"
                            value={formData.language}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="go">Go</option>
                        </select>
                    </div>
                </div>

                {/* Right Column - Heavy Text & Submission */}
                <div className="flex flex-col h-full space-y-6">
                    <div className="flex-1 flex flex-col space-y-3 min-h-0">
                        <label className="block text-sm font-medium">Solution Code (Optional)</label>
                        <textarea
                            placeholder="Paste your raw code here..."
                            className="w-full flex-1 p-4 rounded-xl border border-input bg-muted/50 font-mono text-sm focus:ring-2 focus:ring-ring focus:outline-none transition-all placeholder:text-muted-foreground/50 resize-y whitespace-pre"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            spellCheck={false}
                        />
                    </div>

                    <div className="shrink-0 space-y-3">
                        <label className="block text-sm font-medium">Quick Intake Notes (Optional)</label>
                        <textarea
                            placeholder="Brief intuition or trick..."
                            className="w-full h-[100px] p-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:outline-none transition-all placeholder:text-muted-foreground/50 resize-none"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="shrink-0 w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-auto"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Save to Vault
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
