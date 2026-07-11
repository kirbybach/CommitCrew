
"use client";

import { useDemoStore } from "../stores/useDemoStore";
import { anonymize } from "../utils/anonymizer";
import { useEffect, useState } from "react";

interface PrivacyTextProps {
    text: string;
    id?: string; // Optional ID for consistent seeding. If not provided, text is used as seed.
    className?: string;
}

export default function PrivacyText({ text, id, className = "" }: PrivacyTextProps) {
    const { isDemoMode } = useDemoStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // During SSR, or while not mounted, or if specifically hidden by CSS (though this logic runs in JS)
    // We rely on the global CSS .pii-safe rule to hide the raw text initially.
    // However, if we want to change the TEXT content, we need JS.

    // Logic:
    // 1. If not mounted, render original text (wrapped in pii-safe so it's hidden by CSS).
    // 2. If mounted:
    //    a. If demo mode: Render Anonymized Text.
    //    b. If normal mode: Render Original Text.

    const displayId = id || text;
    const content = (mounted && isDemoMode) ? anonymize(displayId, 'name') : text;

    return (
        <span className={`pii-safe ${className}`}>
            {content}
        </span>
    );
}
