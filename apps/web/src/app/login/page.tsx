
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push('/');
                router.refresh(); // Refresh to ensure middleware re-runs/state updates
            } else {
                const data = await res.json();
                setError(data.error || 'Access denied');
            }
        } catch {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-neutral-800/50 p-8 rounded-2xl border border-neutral-700/50 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-neutral-700 text-emerald-400">
                        <Lock size={20} />
                    </div>
                    <h1 className="text-2xl font-bold">Team Access</h1>
                    <p className="text-neutral-400 text-sm mt-1">Please enter the shared password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password..."
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-center font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        {loading ? 'Verifying...' : 'Enter Dashboard'}
                    </button>
                </form>
            </div>
        </main>
    );
}
