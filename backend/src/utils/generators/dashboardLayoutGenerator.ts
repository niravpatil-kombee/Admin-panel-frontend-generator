// src/utils/generators/dashboardLayoutGenerator.ts
import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateDashboardLayout(): void {
  const dir = path.join(getBaseDir(), "src", "layout");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const content = `
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";

// Custom hook to check for screen size
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  
  return matches;
};

export default function DashboardLayout() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const location = useLocation();

  // Automatically adjust sidebar state based on screen size
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else if (isTablet) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile, isTablet]);

  // Close sidebar on route change when in mobile view
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobile, isSidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={isMobile} />
      
      {/* Backdrop overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out",
        // Adjust layout based on sidebar state and screen size
        // !isMobile && isSidebarOpen && "md:ml-72",
        !isMobile && !isSidebarOpen && "md:ml-16"
      )}>
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-9xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation Indicator */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="Open navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, "DashboardLayout.tsx"), content, "utf8");
  console.log("✅ Generated responsive DashboardLayout component with improved mobile handling.");
}