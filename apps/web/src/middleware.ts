
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Whitelisted Paths (RegEx or Exact Match)
// These paths are accessible WITHOUT the shared password.
const PUBLIC_PATHS = [
    '/login',
    '/api/auth/login',
    '/_next', // Important for assets
    '/favicon.ico',
    '/public', // Maybe user wants public assets
    // '/api/webhooks', // If we have webhooks later, might need exclusion or different auth
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

    if (demoMode) {
        return NextResponse.next();
    }

    // 1. Check if public path
    const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));
    if (isPublic) {
        return NextResponse.next();
    }

    // 2. Get Token
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
        // Redirect to login
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 3. Verify Token
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
        const { payload } = await jwtVerify(token, secret);

        // 4. Check Session Version
        const currentVersion = process.env.SESSION_VERSION || '1';
        if (payload.version !== currentVersion) {
            console.warn("Session version mismatch. Revoking access.");
            // Token is valid signature but old version -> Redirect to login (and maybe clear cookie?)
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('access_token');
            return response;
        }

        return NextResponse.next();
    } catch {
        // Validation failed
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('access_token');
        return response;
    }
}

export const config = {
    // Matcher: Match all paths except Static files (to avoid running middleware on massive amount of static assets if we didn't whitelist _next properly above, but explicit whitelist in code is safer often).
    // Actually, Next.js Matcher is efficient.
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
