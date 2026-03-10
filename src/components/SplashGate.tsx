'use client';

import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './SplashScreen';

export function SplashGate({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState<boolean | null>(null);

    useEffect(() => {
        const seen = sessionStorage.getItem('loop-splash-seen');
        if (seen) {
            setShowSplash(false);
        } else {
            setShowSplash(true);
        }
    }, []);

    const handleComplete = useCallback(() => {
        sessionStorage.setItem('loop-splash-seen', 'true');
        setShowSplash(false);
    }, []);

    // Don't render anything until we know (prevents flash)
    if (showSplash === null) {
        return null;
    }

    return (
        <>
            {showSplash && <SplashScreen onComplete={handleComplete} />}
            {children}
        </>
    );
}
