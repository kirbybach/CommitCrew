"use client";

import React, { useEffect, useState } from 'react';
import { useDemoStore } from '../stores/useDemoStore';
import { anonymize } from '../utils/anonymizer';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface UserAvatarProps {
    name?: string;
    avatarUrl?: string | null;
    userId?: string; // Critical for consistent anonymization
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export default function UserAvatar({ name, avatarUrl, userId, size = 'md', className = '' }: UserAvatarProps) {
    const { isDemoMode } = useDemoStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Size mappings
    const sizeClasses = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm',
        xl: 'w-24 h-24 text-3xl'
    };

    const baseClass = twMerge(clsx(
        "rounded-full flex items-center justify-center font-bold object-cover pii-safe",
        sizeClasses[size],
        { "not-mounted": !mounted },
        className
    ));

    // If Demo Mode is Active (and mounted)
    if (mounted && isDemoMode) {
        // Generate Gradient
        const gradient = anonymize(userId || name || 'unknown', 'avatar');
        return (
            <div
                className={baseClass}
                style={{ background: gradient }}
            >
                {/* No text in avatar for demo mode, or maybe generic icon? Keeping it clean with just gradient */}
            </div>
        );
    }

    // Default Rendering (Real Data)
    // Note: The 'pii-safe' class on the container ensures this is hidden via CSS until hydration complete.

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name || 'User'}
                className={baseClass}
            // Need to remove pii-safe here if we don't want the img tag itself to be responsible, 
            // but actually we DO want it hidden.
            // However, img tags don't have 'children', so baseClass works on the img itself.
            />
        );
    }

    // Fallback Initials
    const initials = name?.substring(0, 2).toUpperCase() || '??';

    return (
        <div className={twMerge(baseClass, "bg-emerald-900/50 text-emerald-400 border border-emerald-500/20")}>
            {initials}
        </div>
    );
}
