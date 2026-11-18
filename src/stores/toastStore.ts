import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'danger';

type ToastState = {
  message: string | null;
  tone: ToastTone;
  nonce: number;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
};

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  tone: 'default',
  nonce: 0,
  show: (message, tone = 'default') => {
    if (timer) clearTimeout(timer);
    set((state) => ({ message, tone, nonce: state.nonce + 1 }));
    timer = setTimeout(() => set({ message: null }), 2400);
  },
  hide: () => {
    if (timer) clearTimeout(timer);
    set({ message: null });
  },
}));

export const toast = {
  show: (message: string, tone: ToastTone = 'default') =>
    useToastStore.getState().show(message, tone),
  success: (message: string) => useToastStore.getState().show(message, 'success'),
  error: (message: string) => useToastStore.getState().show(message, 'danger'),
};
