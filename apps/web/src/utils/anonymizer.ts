
/**
 * Deterministic Anonymizer
 * Uses a seeded RNG (mulberry32) to generate consistent pseudonyms based on the user ID.
 */

const ADJECTIVES = [
    "Stealthy", "Hidden", "Secret", "Anonymous", "Unknown", "Mysterious", "Silent", "Shadow", "Ghost", "Cipher",
    "Rapid", "Grand", "Cosmic", "Prime", "Elite", "Pro", "Master", "Ultra", "Hyper", "Mega"
];

const NOUNS = [
    "Agent", "User", "Operator", "Engineer", "Designer", "Coder", "Hacker", "Phantom", "Ninja", "Wizard",
    "Bot", "Droid", "Unit", "System", "Node", "Proxy", "Server", "Client", "Admin", "Mod"
];

// Simple hashing function to turn a string into a seed number
function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1 ^ h2 ^ h3 ^ h4) >>> 0;
}

// Seeded Random Number Generator
function mulberry32(a: number) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function anonymize(id: string, type: 'name' | 'avatar' = 'name'): string {
    if (!id) return type === 'name' ? 'Unknown' : '';

    const seed = cyrb128(id);
    const rand = mulberry32(seed);

    if (type === 'name') {
        const adj = ADJECTIVES[Math.floor(rand() * ADJECTIVES.length)];
        const noun = NOUNS[Math.floor(rand() * NOUNS.length)];
        const num = Math.floor(rand() * 1000).toString().padStart(3, '0');
        return `${adj} ${noun} ${num}`;
    }

    // Generate a consistent gradient for avatar
    const hue1 = Math.floor(rand() * 360);
    const hue2 = (hue1 + 40 + Math.floor(rand() * 60)) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))`;
}
