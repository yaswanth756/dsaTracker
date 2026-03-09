'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Editor } from '@monaco-editor/react';
import { ArrowLeft, ExternalLink, Save, Loader2, Code2, BookOpen, Trash, LayoutPanelLeft, GripVertical, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { apiFetch } from '@/lib/apiClient';

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
}

export default function ProblemDetail({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const { resolvedTheme } = useTheme();

    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [code, setCode] = useState('');
    const [notes, setNotes] = useState('');
    const [language, setLanguage] = useState('cpp');
    const [fontSize, setFontSize] = useState(14);

    // Left panel tabs
    const [activeTab, setActiveTab] = useState<'notes' | 'problem'>('notes');
    const [problemHtml, setProblemHtml] = useState<string | null>(null);
    const [fetchingHtml, setFetchingHtml] = useState(false);

    useEffect(() => {
        const savedFontSize = localStorage.getItem('dsa-vault-font-size');
        if (savedFontSize) {
            setFontSize(parseInt(savedFontSize, 10));
        }
    }, []);

    const handleFontSizeChange = (updater: (prev: number) => number) => {
        setFontSize((prev) => {
            const next = updater(prev);
            localStorage.setItem('dsa-vault-font-size', next.toString());
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
                    setCode(json.data.code || '// Write your intuition and code here...');
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
                            setProblemHtml('<div class="text-muted-foreground p-4">Could not load problem description natively. Please click the External Link button above.</div>');
                        }
                    } catch (e) {
                        setProblemHtml('<div class="text-red-500 p-4">Failed to fetch. Please click the External Link button above.</div>');
                    } finally {
                        setFetchingHtml(false);
                    }
                }
            } else if (activeTab === 'problem' && problem?.platform !== 'leetcode' && problem?.platform !== 'gfg') {
                setProblemHtml(`<div class="text-muted-foreground p-4">Native embedding is currently only supported for LeetCode and GeeksForGeeks. Please click the External Link button above to open ${problem?.platform}.</div>`);
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
            // Optionally show a toast here
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

    if (loading) {
        return (
            <div className="flex bg-background h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!problem) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4 animate-in fade-in duration-500">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between mx-2">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="capitalize font-medium text-foreground/80">{problem.platform}</span>
                            <span>•</span>
                            <span className="capitalize">{problem.difficulty}</span>
                            {problem.categories.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{problem.categories.join(', ')}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDelete}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        title="Delete problem"
                    >
                        <Trash className="w-5 h-5" />
                    </button>

                    <a
                        href={problem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open in ${problem.platform}`}
                        className="flex items-center justify-center bg-secondary text-secondary-foreground w-10 h-10 rounded-full hover:bg-secondary/80 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        title="Save Changes"
                        className="flex items-center justify-center bg-primary text-primary-foreground w-10 h-10 rounded-full hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Split Pane */}
            <div className="flex-1 mx-2 min-h-0 pb-2">
                <PanelGroup direction="horizontal" className="gap-2" autoSaveId="dsa-vault-panel-layout">
                    {/* Left Panel: Notes / Problem */}
                    <Panel defaultSize={50} minSize={30}>
                        <div className="flex flex-col h-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30">
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`flex items-center gap-2 font-semibold text-sm transition-colors ${activeTab === 'notes' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Intuition & Notes
                                </button>
                                <button
                                    onClick={() => setActiveTab('problem')}
                                    className={`flex items-center gap-2 font-semibold text-sm transition-colors ${activeTab === 'problem' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
                                >
                                    <LayoutPanelLeft className="w-4 h-4" />
                                    Problem Description
                                </button>
                            </div>

                            <div className="flex-1 relative overflow-auto">
                                {activeTab === 'notes' ? (
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Write down the main intuition, edge cases, or step-by-step logic here..."
                                        className="absolute inset-4 resize-none bg-transparent outline-none focus:ring-0 text-base leading-relaxed p-0 placeholder:text-muted-foreground/50 transition-colors"
                                    />
                                ) : (
                                    <div className="absolute inset-0 p-6 overflow-auto">
                                        {fetchingHtml ? (
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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

                    <PanelResizeHandle className="w-2 rounded-full cursor-col-resize flex items-center justify-center hover:bg-primary/20 transition-colors group">
                        <GripVertical className="w-4 h-4 text-border group-hover:text-primary transition-colors" />
                    </PanelResizeHandle>

                    {/* Right Panel: Code */}
                    <Panel defaultSize={50} minSize={30}>
                        <div className="flex flex-col h-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <Code2 className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-sm">Solution Code</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5">
                                        <button
                                            title="Decrease Font Size"
                                            onClick={() => handleFontSizeChange(f => Math.max(10, f - 1))}
                                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-xs font-medium w-4 text-center">{fontSize}</span>
                                        <button
                                            title="Increase Font Size"
                                            onClick={() => handleFontSizeChange(f => Math.min(24, f + 1))}
                                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="bg-transparent text-sm font-medium outline-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
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
                                    }}
                                    className="absolute inset-0"
                                />
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}
