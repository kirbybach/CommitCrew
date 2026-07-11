
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { password } = await req.json();

        // 1. Get Secrets from Env
        const expectedHash = process.env.SHARED_DASHBOARD_PASSWORD_HASH;
        const jwtSecret = process.env.JWT_SECRET;
        const sessionVersion = process.env.SESSION_VERSION || '1'; // Default to 1

        if (!expectedHash || !jwtSecret) {
            console.error("Missing Auth Env Variables");
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // 2. Hash Provided Password
        const inputHash = crypto.createHash('sha256').update(password).digest('hex');

        // 3. Compare Hashes (Timing Safe)
        // Note: crypto.timingSafeEqual requires Buffers of equal length.
        const inputBuffer = Buffer.from(inputHash);
        const expectedBuffer = Buffer.from(expectedHash);

        // Simple comparison if lengths differ (fail fast-ish), but try to be safe
        const match = inputBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(inputBuffer, expectedBuffer);

        if (!match) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        // 4. Sign JWT with jose (Edge compatible)
        const secret = new TextEncoder().encode(jwtSecret);
        const token = await new SignJWT({ version: sessionVersion, authorized: true })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('90d') // Long lived session
            .sign(secret);

        // 5. Set Cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 90, // 90 days in seconds
            path: '/',
        });

        return response;

    } catch (e) {
        console.error("Login Handler Error:", e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
