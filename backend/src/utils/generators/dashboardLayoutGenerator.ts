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
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);
  return matches;
};

export default function DashboardLayout() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const location = useLocation();

  // Automatically adjust sidebar state based on screen size
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // Close sidebar on route change when in mobile view
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={isMobile} />
      
      {/* Backdrop overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-30"
          aria-hidden="true"
        ></div>
      )}

      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300", 
        // Only apply margin-left on desktop view when sidebar is open
        // !isMobile && (isSidebarOpen ? "ml-72" : "ml-20")
      )}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, "DashboardLayout.tsx"), content, "utf8");
  console.log("✅ Generated Responsive DashboardLayout component.");
}