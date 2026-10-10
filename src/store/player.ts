import { create } from "zustand";

interface PlayerState {
  index: number;
  total: number;
  playing: boolean;
  /** Milliseconds between steps while playing. */
  speed: number;
  reset: (total: number) => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  toggle: () => void;
  setSpeed: (speed: number) => void;
}

const clamp = (n: number, total: number) => Math.max(0, Math.min(n, total - 1));

export const usePlayer = create<PlayerState>((set, get) => ({
  index: 0,
  total: 0,
  playing: false,
  speed: 800,
  reset: (total) => set({ index: 0, total, playing: false }),
  goTo: (index) => set({ index: clamp(index, get().total) }),
  next: () => {
    const { index, total } = get();
    if (index >= total - 1) set({ playing: false });
    else set({ index: index + 1 });
  },
  prev: () => set({ index: clamp(get().index - 1, get().total) }),
  toggle: () => {
    const { playing, index, total } = get();
    // Restart from the beginning when pressing play at the end.
    if (!playing && index >= total - 1) set({ index: 0, playing: true });
    else set({ playing: !playing });
  },
  setSpeed: (speed) => set({ speed }),
}));
