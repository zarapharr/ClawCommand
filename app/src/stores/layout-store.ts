import { create } from "zustand";

/**
 * Layout Store
 * Manages persistent UI state (sidebar, modals, theme)
 */
interface LayoutState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Theme
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;

  // Modal states
  modalsOpen: Map<string, boolean>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;

  // Active navigation
  activeNavItem: string | null;
  setActiveNavItem: (id: string | null) => void;

  // Real-time data indicator
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useStore = create<LayoutState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Theme
  darkMode: true,
  setDarkMode: (dark) => set({ darkMode: dark }),

  // Modals
  modalsOpen: new Map(),
  openModal: (id) =>
    set((state) => ({
      modalsOpen: new Map(state.modalsOpen).set(id, true),
    })),
  closeModal: (id) =>
    set((state) => {
      const newMap = new Map(state.modalsOpen);
      newMap.delete(id);
      return { modalsOpen: newMap };
    }),

  // Navigation
  activeNavItem: null,
  setActiveNavItem: (id) => set({ activeNavItem: id }),

  // Real-time
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),
}));
