
import { create } from 'zustand';

interface DemoState {
    isDemoMode: boolean;
    setDemoMode: (value: boolean) => void;
}

export const useDemoStore = create<DemoState>()((set) => ({
    isDemoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== 'false',
    setDemoMode: (value) => set({ isDemoMode: value }),
}));
