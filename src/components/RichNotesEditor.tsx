'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { useEffect, useRef } from 'react';
import {
    Bold,
    Heading2,
    Type,
    AlertTriangle,
    Highlighter,
} from 'lucide-react';

interface RichNotesEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export default function RichNotesEditor({ content, onChange }: RichNotesEditorProps) {
    const initialized = useRef(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            Highlight.configure({ multicolor: true }),
            Placeholder.configure({
                placeholder: 'Write your notes… Select text to format it ✨',
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'rich-notes-editor prose prose-sm dark:prose-invert max-w-none outline-none min-h-full whitespace-pre-wrap px-6 py-5 focus:outline-none',
            },
        },
        immediatelyRender: false,
    });

    // Sync external content changes (e.g., on load)
    useEffect(() => {
        if (editor && content && !initialized.current) {
            editor.commands.setContent(content);
            initialized.current = true;
        }
    }, [editor, content]);

    if (!editor) return null;

    const BubbleButton = ({
        active,
        onClick,
        children,
        title,
        color,
    }: {
        active?: boolean;
        onClick: () => void;
        children: React.ReactNode;
        title: string;
        color?: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`
                relative flex items-center justify-center w-8 h-8 rounded-lg text-xs transition-all duration-150
                ${active
                    ? color
                        ? `${color} shadow-sm`
                        : 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }
            `}
        >
            {children}
        </button>
    );

    const Divider = () => (
        <div className="w-px h-5 bg-border/60 mx-0.5" />
    );

    return (
        <div className="relative h-full flex flex-col">
            {/* ── Bubble Menu (appears on text selection like Medium) ── */}
            <BubbleMenu
                editor={editor}
                className="flex items-center gap-0.5 px-1.5 py-1 bg-card border border-border rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 backdrop-blur-xl"
            >
                {/* ── Text Type ── */}
                <BubbleButton
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Heading"
                >
                    <Heading2 className="w-4 h-4" />
                </BubbleButton>
                <BubbleButton
                    active={editor.isActive('paragraph')}
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    title="Body Text"
                >
                    <Type className="w-4 h-4" />
                </BubbleButton>

                <Divider />

                {/* ── Formatting ── */}
                <BubbleButton
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </BubbleButton>

                <Divider />

                {/* ── Highlight & Important ── */}
                <BubbleButton
                    active={editor.isActive('highlight', { color: '#fef08a' })}
                    onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                    title="Highlight"
                    color="bg-yellow-400/20 text-yellow-600 dark:text-yellow-400"
                >
                    <Highlighter className="w-4 h-4" />
                </BubbleButton>
                <BubbleButton
                    active={editor.isActive('highlight', { color: '#fecaca' })}
                    onClick={() => editor.chain().focus().toggleHighlight({ color: '#fecaca' }).run()}
                    title="Important"
                    color="bg-red-400/20 text-red-600 dark:text-red-400"
                >
                    <AlertTriangle className="w-4 h-4" />
                </BubbleButton>
            </BubbleMenu>

            {/* ── Editor Area ── */}
            <div className="flex-1 overflow-auto">
                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    );
}
