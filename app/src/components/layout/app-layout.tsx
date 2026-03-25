import React, { useEffect, useState } from "react";
import { useStore } from "../../stores/layout-store";

/**
 * AppLayout Component
 * Main application layout with sidebar + top bar + content
 * Handles responsive breakpoints and keyboard shortcuts
 */
interface AppLayoutProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, topBar, sidebar }) => {
  const { sidebarOpen, toggleSidebar } = useStore();
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        console.log("Search triggered");
      }

      // Esc to close modals/sidebars
      if (e.key === "Escape") {
        if (isMobile && sidebarOpen) {
          toggleSidebar();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, sidebarOpen, toggleSidebar]);

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      {/* Sidebar */}
      {(!isMobile || sidebarOpen) && (
        <aside className="w-64 border-r border-neutral-800 bg-neutral-900 overflow-y-auto">
          {sidebar || <div className="p-4 text-neutral-500">Sidebar</div>}
        </aside>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-neutral-800 bg-neutral-900 px-6 flex items-center justify-between">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
          )}
          {topBar || <div className="text-neutral-500">Top Bar</div>}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};
