import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils"; // Make sure you have a cn utility function

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col flex-1 transition-all duration-300",
          // Apply margin-left that matches the sidebar's width
          sidebarOpen ? "ml-72" : "ml-16"
        )}
      >
        {/* Header */}
        <Header />

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto">
          {/* The Outlet will render the content of your routes, like the form */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}