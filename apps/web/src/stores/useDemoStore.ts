
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DemoState {
    isDemoMode: boolean;
    toggleDemoMode: () => void;
    setDemoMode: (value: boolean) => void;
}

export const useDemoStore = create<DemoState>()(
    persist(
        (set) => ({
            isDemoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== 'false',
            toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
            setDemoMode: (value) => set({ isDemoMode: value }),
        }),
        {
            name: 'demo-mode-storage',
            // onRehydrateStorage removed to prevent hydration mismatch. 
            // We use DemoInit component instead.
        }
    )
);
