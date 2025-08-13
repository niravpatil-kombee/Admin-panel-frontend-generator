import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Define the type for a navigation item. Icon is optional.
type NavItem = {
  label: string;
  icon?: React.ElementType;
  href?: string;
  children?: NavItem[];
};

// The data structure remains the same
const navItems: NavItem[] = [
  { label: "Dashboard", icon: Home, href: "/" },
  { label: "Users", icon: Users, href: "/userform" },
  {
    label: "Reports",
    icon: FileText,
    children: [
      { label: "Sales", href: "/reports/sales" },
      {
        label: "Analytics",
        href: "/reports/analytics",
        children: [
          {
            label: "Traffic",
            href: "/reports/analytics/traffic",
          },
          {
            label: "Conversions",
            href: "/reports/analytics/conversions",
          },
        ],
      },
    ],
  },
  { label: "Settings", icon: Settings, href: "/settings" },
];

// Helper function to check if a link or any of its children is active
const isLinkActive = (item: NavItem, pathname: string): boolean => {
  if (item.href === pathname) return true;
  return item.children?.some((child) => isLinkActive(child, pathname)) ?? false;
};

interface SidebarProps {
  isOpen: boolean;
  onMenuClick: () => void;
}

// REFACTORED: This component is updated for smoother transitions.
const NavMenu: React.FC<{
  items: NavItem[];
  pathname: string;
  level: number;
}> = ({ items, pathname, level }) => {
  return (
    <div className={cn("space-y-1", level > 0 && "pl-4 py-1")}>
      {items.map((item) => {
        const Icon = item.icon;
        return item.children ? (
          <Collapsible
            key={item.label}
            className="w-full"
            defaultOpen={isLinkActive(item, pathname)}
          >
            <CollapsibleTrigger
              className={cn(
                "flex items-center justify-between w-full p-2 rounded-md hover:bg-gray-800 transition-colors cursor-pointer",
                isLinkActive(item, pathname) &&
                  !item.children.some((c) => c.href === pathname)
                  ? "bg-gray-800"
                  : ""
              )}
            >
              {/* ... trigger content ... */}
              <div className="flex items-center gap-3">
                {level > 0 ? (
                  <span className="flex h-full w-[18px] items-center justify-center">
                    <Circle className="h-1.5 w-1.5 fill-current text-current" />
                  </span>
                ) : (
                  Icon && <Icon size={18} />
                )}
                <span>{item.label}</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <NavMenu
                items={item.children}
                pathname={pathname}
                level={level + 1}
              />
            </CollapsibleContent>
          </Collapsible>
        ) : (
      
          <Link
            key={item.href}
            to={item.href || "#"}
            className={cn(
              "flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 transition-colors text-gray-300 hover:text-white",
              pathname === item.href
                ? "bg-gray-700 text-white font-semibold"
                : ""
            )}
          >
            {level > 0 ? (
              <span className="flex h-full w-[18px] items-center justify-center">
                <Circle className="h-1.5 w-1.5 fill-current text-current" />
              </span>
            ) : (
              Icon && <Icon size={18} />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default function Sidebar({ isOpen, onMenuClick }: SidebarProps) {
  const location = useLocation();

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
        {isOpen ? (
          <NavMenu items={navItems} pathname={location.pathname} level={0} />
        ) : (
          navItems.map((item) => {
            const Icon = item.icon;
            return (
              Icon && (
                <Link
                  key={item.label}
                  to={item.href || "#"}
                  title={item.label}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-md hover:bg-gray-800 transition-colors",
                    isLinkActive(item, location.pathname) ? "bg-gray-800" : ""
                  )}
                >
                  <Icon size={18} />
                </Link>
              )
            );
          })
        )}
      </nav>
    </aside>
  );
}
