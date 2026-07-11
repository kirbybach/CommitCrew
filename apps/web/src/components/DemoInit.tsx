
"use client";

import { useEffect } from "react";

/**
 * DemoInit
 * This component handles the side-effect of applying the 'demo-ready' class to the body.
 * We do this in a useEffect to ensure it happens after hydration, avoiding
 * "Hypdration failed because the initial UI does not match what was rendered on the server" assertions on the body tag.
 */
export default function DemoInit() {
    useEffect(() => {
        // Signal that client-side js is ready and we can reveal the content (which is initially hidden by .pii-safe css)
        document.body.classList.add('demo-ready');
    }, []);

    // We can also sync store state if needed, but the main goal is just the visual reveal signal
    return null;
}
