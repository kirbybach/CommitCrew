
"use client";

interface PrivacyTextProps {
    text: string;
    id?: string;
    className?: string;
}

export default function PrivacyText({ text, className = "" }: PrivacyTextProps) {
    return (
        <span className={`pii-safe ${className}`}>
            {text}
        </span>
    );
}
