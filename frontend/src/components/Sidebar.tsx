import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onMenuClick: () => void;
}

export default function Sidebar({ isOpen, onMenuClick }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", icon: Home, href: "/" },
    { label: "Users", icon: Users, href: "/userform" },
    { label: "Reports", icon: FileText, href: "/reports" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full bg-[#0F172A] text-white border-r border-gray-800 transition-all duration-300 z-40 flex flex-col",
        isOpen ? "w-72" : "w-16"
      )}
    >
      <div className="p-2 border-b border-gray-800 flex items-center">
        {isOpen && <span className="font-bold mr-auto ml-2">Admin Panel</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-white hover:bg-gray-700 hover:text-white"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>

      <nav className="flex flex-col p-2 space-y-1 flex-1">
        {navItems.map(({ label, icon: Icon, href }) => (
          <Link
            key={href}
            to={href}
            className={cn(
              "flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition-colors",
              location.pathname === href ? "bg-gray-800" : "",
              isOpen ? "gap-3" : "justify-center"
            )}
          >
            <Icon size={18} />
            {isOpen && <span>{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}