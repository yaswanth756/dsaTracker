'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, Plus, Home, Code2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function Sidebar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const navItems = [
        { href: '/', label: 'Dashboard', icon: Home },
        { href: '/new', label: 'Add Problem', icon: Plus },
    ];

    const handleLogout = () => {
        localStorage.removeItem('dsa-vault-token');
        localStorage.removeItem('dsa-vault-user');
        router.push('/login');
    };

    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    return (
        <aside className="w-16 h-screen border-r border-border/40 bg-card/50 flex flex-col justify-between shrink-0">
            <div className="flex flex-col gap-6 py-6 px-2">
                {/* Logo */}
                <Link href="/" title="Vault" className="flex justify-center mb-4 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Code2 className="w-5 h-5" />
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex flex-col gap-3 items-center">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.label}
                                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer / Theme Toggle */}
            <div className="p-4 border-t border-border/40 flex flex-col items-center gap-3">
                <button
                    onClick={handleLogout}
                    title="Logout"
                    className="flex justify-center items-center w-10 h-10 rounded-xl text-red-500 hover:bg-red-500/10 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                </button>
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title="Toggle theme"
                        className="flex justify-center items-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-200"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </aside>
    );
}
