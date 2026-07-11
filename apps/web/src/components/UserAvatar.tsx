"use client";

import React, { useEffect, useState } from 'react';
import { useDemoStore } from '../stores/useDemoStore';
import { avatarGradient } from '../utils/avatarGradient';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface UserAvatarProps {
    name?: string;
    avatarUrl?: string | null;
    userId?: string;
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
        "rounded-full border-2 border-[var(--line)] shadow-[2px_2px_0_var(--line)] flex items-center justify-center font-bold object-cover pii-safe",
        sizeClasses[size],
        { "not-mounted": !mounted },
        className
    ));

    if (mounted && isDemoMode) {
        const gradient = avatarGradient(userId || name || 'unknown');
        return (
            <div
                className={baseClass}
                style={{ background: gradient }}
            >
            </div>
        );
    }

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name || 'User'}
                className={baseClass}
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
