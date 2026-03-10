'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';

const words = [
    "Track.",
    "Revise.",
    "Master.",
];

// All quotes with their highlighted word
const quotes = [
    {
        before: "Winner may not be the one who is talented but",
        highlight: "definitely",
        after: "the one who is hard working.",
        footer: "Keep grinding.",
    },
    {
        before: "Believe in yourself, because you are capable of achieving greatness beyond your",
        highlight: "imagination.",
        after: "",
        footer: "You got this.",
    },
    {
        before: "The only way to achieve the impossible is to believe, it is",
        highlight: "possible.",
        after: "",
        footer: "Never stop believing.",
    },
    {
        before: "In the world of coding,",
        highlight: "persistence",
        after: "is the key to success.",
        footer: "Stay consistent.",
    },
    {
        before: "Don't watch the clock; do what it does. Keep",
        highlight: "going.",
        after: "",
        footer: "One step at a time.",
    },
    {
        before: "Success is not final, failure is not fatal: it is the courage to",
        highlight: "continue",
        after: "that counts.",
        footer: "Keep pushing forward.",
    },
    {
        before: "The only limit to our realization of tomorrow will be our",
        highlight: "doubts",
        after: "of today.",
        footer: "Trust the process.",
    },
    {
        before: "Hard work beats talent when talent doesn't",
        highlight: "work hard.",
        after: "",
        footer: "Outwork everyone.",
    },
];

// Custom Loop logo component
function LoopLogo({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 7.07 17.07" />
            <path d="M12 22a10 10 0 0 1-7.07-17.07" />
            <polyline points="16 12 12 8 8 12" />
        </svg>
    );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [phase, setPhase] = useState<'quote' | 'brand'>('quote');
    const [currentWord, setCurrentWord] = useState(0);
    const [showTagline, setShowTagline] = useState(false);
    const [exiting, setExiting] = useState(false);

    // Pick a random quote once on mount
    const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

    useEffect(() => {
        const brandTimer = setTimeout(() => setPhase('brand'), 4000);

        const wordTimers: NodeJS.Timeout[] = [];
        words.forEach((_, i) => {
            wordTimers.push(
                setTimeout(() => setCurrentWord(i), 4000 + i * 700 + 800)
            );
        });

        const taglineTimer = setTimeout(() => setShowTagline(true), 4000 + words.length * 700 + 1200);
        const exitTimer = setTimeout(() => setExiting(true), 4000 + words.length * 700 + 2800);
        const completeTimer = setTimeout(() => onComplete(), 4000 + words.length * 700 + 3600);

        return () => {
            clearTimeout(brandTimer);
            wordTimers.forEach(clearTimeout);
            clearTimeout(taglineTimer);
            clearTimeout(exitTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    // Build word array with highlight index
    const beforeWords = quote.before ? quote.before.split(' ') : [];
    const highlightWords = quote.highlight.split(' ');
    const afterWords = quote.after ? quote.after.split(' ') : [];
    const allWords = [...beforeWords, ...highlightWords, ...afterWords];
    const highlightStart = beforeWords.length;
    const highlightEnd = beforeWords.length + highlightWords.length - 1;

    return (
        <AnimatePresence>
            {!exiting && (
                <motion.div
                    className="fixed inset-0 z-9999 flex items-center justify-center bg-background overflow-hidden"
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Subtle dot grid */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                                backgroundSize: '40px 40px',
                            }}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.03 }}
                            transition={{ duration: 2, ease: 'easeOut' }}
                        />
                    </div>

                    {/* Glow */}
                    <motion.div
                        className="absolute w-75 h-75 rounded-full bg-primary/5 blur-3xl"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />

                    <div className="relative flex flex-col items-center gap-8 px-6">
                        <AnimatePresence mode="wait">
                            {/* ── Phase 1: Random Motivational Quote ── */}
                            {phase === 'quote' && (
                                <motion.div
                                    key="quote"
                                    className="flex flex-col items-center gap-6 max-w-xl"
                                    exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <motion.div
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <Quote className="w-8 h-8 text-primary/30" />
                                    </motion.div>

                                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center leading-snug sm:leading-snug">
                                        {allWords.map((word, i) => {
                                            const isHighlighted = i >= highlightStart && i <= highlightEnd;
                                            return (
                                                <motion.span
                                                    key={i}
                                                    className={`inline-block mr-[0.3em] ${
                                                        isHighlighted
                                                            ? 'text-primary italic'
                                                            : 'text-foreground/85'
                                                    }`}
                                                    initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                                    transition={{
                                                        duration: 0.3,
                                                        delay: 0.4 + i * 0.08,
                                                        ease: 'easeOut',
                                                    }}
                                                >
                                                    {isHighlighted ? (
                                                        <span className="relative">
                                                            {word}
                                                            {i === highlightEnd && (
                                                                <motion.span
                                                                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary/60 rounded-full"
                                                                    initial={{ scaleX: 0 }}
                                                                    animate={{ scaleX: 1 }}
                                                                    transition={{
                                                                        duration: 0.4,
                                                                        delay: 0.4 + i * 0.08 + 0.3,
                                                                        ease: [0.22, 1, 0.36, 1],
                                                                    }}
                                                                    style={{ transformOrigin: 'left' }}
                                                                />
                                                            )}
                                                        </span>
                                                    ) : (
                                                        word
                                                    )}
                                                </motion.span>
                                            );
                                        })}
                                    </p>

                                    <motion.div
                                        className="w-16 h-px bg-border"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.6, delay: 2.5 }}
                                    />

                                    <motion.p
                                        className="text-muted-foreground/50 text-xs sm:text-sm tracking-widest uppercase"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5, delay: 2.8 }}
                                    >
                                        {quote.footer}
                                    </motion.p>
                                </motion.div>
                            )}

                            {/* ── Phase 2: Loop Brand Reveal ── */}
                            {phase === 'brand' && (
                                <motion.div
                                    key="brand"
                                    className="flex flex-col items-center gap-8"
                                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    {/* Loop Logo */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                                    >
                                        <motion.div
                                            className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xl"
                                            animate={{
                                                boxShadow: [
                                                    '0 0 0 0 rgba(0,0,0,0)',
                                                    '0 0 60px 10px rgba(128,128,128,0.15)',
                                                    '0 0 0 0 rgba(0,0,0,0)',
                                                ],
                                            }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            <LoopLogo className="w-10 h-10" />
                                        </motion.div>
                                    </motion.div>

                                    {/* Brand Name */}
                                    <motion.h1
                                        className="text-5xl sm:text-6xl font-black tracking-tight"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
                                    >
                                        Loop
                                    </motion.h1>

                                    {/* Cycling Words */}
                                    <div className="h-10 flex items-center justify-center overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={currentWord}
                                                className="text-2xl sm:text-3xl font-bold text-primary/80 tracking-wide"
                                                initial={{ y: 30, opacity: 0, filter: 'blur(8px)' }}
                                                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                                exit={{ y: -30, opacity: 0, filter: 'blur(8px)' }}
                                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                            >
                                                {words[currentWord]}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>

                                    {/* Tagline */}
                                    <AnimatePresence>
                                        {showTagline && (
                                            <motion.p
                                                className="text-muted-foreground text-sm sm:text-base tracking-wide max-w-xs text-center"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                            >
                                                Revision, on repeat.
                                            </motion.p>
                                        )}
                                    </AnimatePresence>

                                    {/* Loading bar */}
                                    <motion.div
                                        className="w-48 h-0.75 bg-muted rounded-full overflow-hidden mt-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <motion.div
                                            className="h-full bg-primary rounded-full"
                                            initial={{ width: '0%' }}
                                            animate={{ width: '100%' }}
                                            transition={{
                                                duration: words.length * 0.7 + 2.2,
                                                ease: [0.22, 1, 0.36, 1],
                                                delay: 0.6,
                                            }}
                                        />
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
