'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Code2, Layers, Calendar, Loader2, Search, Plus, Brain, Mail, FolderOpen, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiFetch } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

interface Problem {
  _id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  platform: string;
  categories: string[];
  status: string;
  updatedAt: string;
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export default function Dashboard() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(12);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reset visible items when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, selectedCategory]);

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 12);
      }
    }, { rootMargin: '200px' });
    
    observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('dsa-vault-token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const [probRes, catRes] = await Promise.all([
          apiFetch('/api/problems'),
          apiFetch('/api/categories')
        ]);

        const probJson = await probRes.json();
        const catJson = await catRes.json();

        if (probJson.success) {
          setProblems(probJson.data);
        }
        if (catJson.success) {
          setCategories(['All', ...catJson.data]);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProblems = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex bg-background h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full overflow-hidden">
        {/* Background glow */}
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Floating icons */}
        {[
          { icon: Code2, x: '15%', y: '20%', delay: 0, size: 20 },
          { icon: Layers, x: '80%', y: '15%', delay: 0.5, size: 18 },
          { icon: Brain, x: '10%', y: '70%', delay: 1, size: 16 },
          { icon: Mail, x: '85%', y: '65%', delay: 1.5, size: 22 },
          { icon: Sparkles, x: '70%', y: '80%', delay: 0.8, size: 14 },
          { icon: Calendar, x: '25%', y: '85%', delay: 1.2, size: 16 },
        ].map(({ icon: Icon, x, y, delay, size }, i) => (
          <motion.div
            key={i}
            className="absolute text-muted-foreground/80 pointer-events-none"
            style={{ left: x, top: y }}
            animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
          >
            <Icon style={{ width: size, height: size }} />
          </motion.div>
        ))}

        {/* Main content */}
        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-lg px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Animated icon */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                <FolderOpen className="w-9 h-9" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-muted-foreground/10 border-2 border-background flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 300 }}
              >
                <span className="text-xs font-bold text-muted-foreground">0</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            Start Your First Loop
          </motion.h2>

          <motion.p
            className="text-muted-foreground mt-3 text-base sm:text-lg leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Track it. Revise it. Never forget it.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2.5 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
          >
            {[
              { icon: Brain, label: 'Revision' },
              { icon: Mail, label: 'Reminders' },
              { icon: Layers, label: 'One Place' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm font-medium border border-border/50"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                {label}
              </span>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="mt-10"
          >
            <Link
              href="/new"
              className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground pl-6 pr-5 py-3.5 rounded-full font-semibold text-base hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              Add Your First Problem
              <ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>
          </motion.div>

          {/* Subtle hint */}
          <motion.p
            className="text-muted-foreground/50 text-xs mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            Powered by Loop
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revision Dashboard</h1>
          <p className="text-muted-foreground mt-1">All your DSA problems in one place — pick up and revise.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Stats Section with LeetCode-style Donut */}
      {problems.length > 0 && (() => {
        const easyProblems = problems.filter(p => p.difficulty === 'easy').length;
        const mediumProblems = problems.filter(p => p.difficulty === 'medium').length;
        const hardProblems = problems.filter(p => p.difficulty === 'hard').length;
        const totalProblems = problems.length;

        const radius = 42;
        const strokeWidth = 5;
        const circum = 2 * Math.PI * radius;

        let currentOffset = 0;
        return (
          <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            {/* Progress Donut */}
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/10 dark:text-muted/20" />

                {[
                  { count: easyProblems, color: '#00b8a3' },    // Easy - Teal
                  { count: mediumProblems, color: '#ffc01e' },  // Medium - Yellow
                  { count: hardProblems, color: '#ef4743' },    // Hard - Red
                ].map((segment, index) => {
                  if (segment.count === 0) return null;

                  const proportion = segment.count / totalProblems;
                  const trueLength = proportion * circum;
                  const segmentSpacing = totalProblems === segment.count ? 0 : 8;
                  const dashLength = Math.max(0, trueLength - segmentSpacing);
                  const dashoffset = -currentOffset;

                  currentOffset += trueLength;

                  return (
                    <circle
                      key={index}
                      cx="50" cy="50" r={radius}
                      fill="transparent"
                      stroke={segment.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={`${dashLength} ${circum}`}
                      strokeDashoffset={dashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight">{totalProblems}</span>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  Solved
                </span>
              </div>
            </div>

            {/* Stats breakdown */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#00b8a3]/5 dark:bg-[#00b8a3]/10 border border-[#00b8a3]/15 rounded-2xl p-4 flex flex-col justify-center">
                <span className="text-[#00b8a3] font-semibold text-sm mb-1">Easy</span>
                <span className="text-2xl font-bold text-foreground">{easyProblems}</span>
              </div>
              <div className="bg-[#ffc01e]/5 dark:bg-[#ffc01e]/10 border border-[#ffc01e]/15 rounded-2xl p-4 flex flex-col justify-center">
                <span className="text-[#ffc01e] font-semibold text-sm mb-1">Medium</span>
                <span className="text-2xl font-bold text-foreground">{mediumProblems}</span>
              </div>
              <div className="bg-[#ef4743]/5 dark:bg-[#ef4743]/10 border border-[#ef4743]/15 rounded-2xl p-4 flex flex-col justify-center">
                <span className="text-[#ef4743] font-semibold text-sm mb-1">Hard</span>
                <span className="text-2xl font-bold text-foreground">{hardProblems}</span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Horizontal Category Scroll */}
      <div className="flex overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
            >
              <span className="capitalize">{category}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredProblems.slice(0, visibleCount).map((problem, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={problem._id}
              className="h-full"
            >
              <Link
                href={`/problems/${problem._id}`}
                className="group flex flex-col h-full relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${difficultyColors[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary decoration-2 underline-offset-4 group-hover:underline transition-all line-clamp-2">
                  {problem.title}
                </h3>

                <div className="flex flex-wrap gap-2 mb-6">
                  {problem.categories.slice(0, 3).map((cat) => (
                    <span key={cat} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span className="capitalize">{cat}</span>
                    </span>
                  ))}
                  {problem.categories.length > 3 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      +{problem.categories.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50 text-sm text-muted-foreground mt-auto">
                  <span className="capitalize font-medium">{problem.platform}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(problem.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredProblems.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>No problems found matching your criteria.</p>
          </div>
        )}
      </div>

      {visibleCount < filteredProblems.length && (
        <div ref={loadMoreRef} className="w-full flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
