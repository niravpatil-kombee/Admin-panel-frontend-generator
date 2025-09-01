import fs from "fs";
import path from "path";
import { ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateSidebar(models: Record<string, ModelConfig>): void {
  const dir = path.join(getBaseDir(), "src", "layout");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const modelEntries = Object.keys(models).map((name) => {
    const lower = name.toLowerCase();
    const createHref = `/${lower}s?action=create`;
    return `{
      label: t('models.${lower}_plural'),
      modelKey: '${lower}',
      icon: "Users",
      children: [
        {
          label: t('sidebar.allModels', { model: t('models.${lower}_plural') }),
          href: \`/${lower}s\`,
        },
        {
          label: t('sidebar.createModel', { model: t('models.${lower}') }),
          href: '${createHref}',
        }
      ]
    }`;
  });

 
const content = `
import * as React from "react";
import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Home, Users, Settings, ChevronLeft, ChevronRight, ChevronDown, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";



const iconMap: { [key: string]: React.ElementType } = { Home, Users, Settings };

// Active link check ignores URL parameters like '?action=create'
const isLinkActive = (item: any, pathname: string): boolean => {
  if (item.href && item.href.split('?')[0] === pathname) return true;
  return item.children?.some((child: any) => isLinkActive(child, pathname)) ?? false;
};

const NavMenu: React.FC<{
  items: any[];
  pathname: string;
  isOpen: boolean;
  openItem: string | null;
  setOpenItem: (label: string | null) => void;
}> = ({ items, pathname, isOpen, openItem, setOpenItem }) => {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = isLinkActive(item, pathname);
        const isDropdownOpen = openItem === item.label;

        if (!isOpen) {
          return (
            <div key={item.label} className="relative group">
              <Link
                to={item.children ? item.children[0].href : item.href!}
                title={item.label}
                className={cn(
                  "flex items-center justify-center p-3 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200",
                  isActive && "text-white"
                )}
              >
                <Icon size={20} />
              </Link>
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </div>
          );
        }

        return item.children ? (
          <Collapsible
            key={item.label}
            className="w-full"
            open={isDropdownOpen}
            onOpenChange={(open) => setOpenItem(open ? item.label : null)}
          >
            <CollapsibleTrigger
              className={cn(
                "flex items-center justify-between w-full p-3 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200",
                isActive && "text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={cn(isActive ? "text-white" : "text-gray-400")} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isDropdownOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-8 py-1 space-y-1">
              {item.children.map((child: any) => (
                <Link
                  key={child.href}
                  to={child.href}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md transition-colors duration-200 text-gray-400 hover:text-white hover:bg-gray-800 text-sm",
                    pathname === child.href.split('?')[0] ? "text-white font-medium" : ""
                  )}
                >
                  <Circle className="h-2 w-2 fill-current flex-shrink-0" />
                  <span className="truncate">{child.label}</span>
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Link
            key={item.href}
            to={item.href!}
            className={cn(
              "flex items-center gap-3 p-3 rounded-md transition-colors duration-200 text-gray-400 hover:text-white hover:bg-gray-800",
              isActive && "text-white"
            )}
          >
            <Icon size={18} />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();
 const [openItem, setOpenItem] = useState<string | null>(null);
  const onToggle = () => setIsOpen(!isOpen);

 const navItems = useMemo(() => [
    { label: t('common.dashboard'), href: "/", icon: "Home" },
    ...[${modelEntries.join(",\n    ")}]
  ], [t]);

  if (isMobile) {
    return (
      <aside className={cn(
        "fixed top-0 left-0 h-full w-80 bg-gray-900 text-white border-r border-gray-800 z-50 flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <span className="font-bold text-lg">{t('common.appName')}</span>
              <p className="text-xs text-gray-400">{t('common.adminPanel')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle} className="text-white hover:bg-gray-700">
            <X size={18} />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <nav className="p-4">
            <NavMenu items={navItems} pathname={location.pathname} isOpen={true} openItem={openItem} setOpenItem={setOpenItem} />
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-gray-400 truncate">admin@example.com</p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={cn(
      "hidden md:flex md:flex-col bg-gray-900 text-white border-r border-gray-800 transition-all duration-300",
      isOpen ? "w-72" : "w-16"
    )}>
      <div className={cn(
        "p-4 border-b border-gray-800 flex items-center bg-gray-900", 
        isOpen ? "justify-between" : "justify-center"
      )}>
        {isOpen && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <span className="font-bold text-lg">{t('common.appName')}</span>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle} 
          className="text-white hover:bg-gray-700 flex-shrink-0"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          <NavMenu items={navItems} pathname={location.pathname} isOpen={isOpen} openItem={openItem} setOpenItem={setOpenItem} />
        </nav>
      </ScrollArea>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-gray-400 truncate">admin@example.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
`;
  fs.writeFileSync(path.join(dir, "Sidebar.tsx"), content, "utf8");
  console.log("✅ Generated responsive Sidebar component with accordion dropdowns, no background highlight, and no + icon.");
}
