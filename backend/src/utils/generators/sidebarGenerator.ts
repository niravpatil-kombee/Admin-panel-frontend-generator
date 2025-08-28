import fs from "fs";
import path from "path";
import { ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateSidebar(models: Record<string, ModelConfig>): void {
  const dir = path.join(getBaseDir(), "src", "components", "layout");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const modelEntries = Object.entries(models).map(([name, config]) => {
    const lower = name.toLowerCase();
    const createHref = config.isPopup ? `/${lower}s?action=create` : `/${lower}/create`;
    return `{
      label: t('models.${lower}_plural'),
      modelKey: '${lower}',
      icon: "Users", // This can be made dynamic later
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
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Home, Users, Settings, ChevronLeft, ChevronRight, ChevronDown, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const iconMap: { [key: string]: React.ElementType } = { Home, Users, Settings };

// UPDATED: The active link check now ignores URL parameters like '?action=create'
const isLinkActive = (item: any, pathname: string): boolean => {
  if (item.href && item.href.split('?')[0] === pathname) return true;
  return item.children?.some((child: any) => isLinkActive(child, pathname)) ?? false;
};

const NavMenu: React.FC<{ items: any[]; pathname: string; isOpen: boolean }> = ({ items, pathname, isOpen }) => {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = isLinkActive(item, pathname);

        if (!isOpen) {
          return (
            <Link
              key={item.label}
              to={item.children ? item.children[0].href : item.href!}
              title={item.label}
              className={cn(
                "flex items-center justify-center p-3 rounded-md text-gray-400 hover:text-white hover:bg-gray-800",
                isActive && "bg-gray-700 text-white"
              )}
            >
              <Icon size={22} />
            </Link>
          );
        }

        return item.children ? (
          <Collapsible key={item.label} className="w-full" defaultOpen={isActive}>
            <CollapsibleTrigger className={cn("flex items-center justify-between w-full p-3 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors", isActive && "text-white")}>
              <div className="flex items-center gap-4">
                <Icon size={20} className={cn(isActive ? "text-white" : "text-gray-400")} />
                <span className="font-semibold">{item.label}</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-10 py-1 space-y-1">
              {item.children.map((child: any) => (
                <Link
                  key={child.href}
                  to={child.href}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md transition-colors text-gray-400 hover:text-white hover:bg-gray-800",
                    pathname === child.href.split('?')[0] ? "text-white font-semibold" : ""
                  )}
                >
                  <Circle className="h-2 w-2 fill-current" />
                  <span>{child.label}</span>
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Link
            key={item.href}
            to={item.href!}
            className={cn(
              "flex items-center gap-4 p-3 rounded-md transition-colors text-gray-400 hover:text-white hover:bg-gray-800",
              isActive && "bg-gray-700 text-white"
            )}
          >
            <Icon size={20} />
            <span className="font-semibold">{item.label}</span>
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
  const onToggle = () => setIsOpen(!isOpen);

  const navItems = React.useMemo(() => [
    { label: t('common.dashboard'), href: "/", icon: "Home" },
    ...[${modelEntries.join(',\n    ')}]
  ], [t]);

  if (isMobile) {
    return (
        <aside className={cn(
          "fixed top-0 left-0 h-full w-72 bg-gray-900 text-white border-r border-gray-800 z-40 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <span className="font-bold text-lg">{t('common.appName')}</span>
            <Button variant="ghost" size="icon" onClick={onToggle} className="text-white hover:bg-gray-700">
              <X size={18} />
            </Button>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
             <NavMenu items={navItems} pathname={location.pathname} isOpen={true} />
          </nav>
        </aside>
    );
  }

  return (
    <aside className={cn(
      "hidden md:flex md:flex-col bg-gray-900 text-white border-r border-gray-800 transition-all duration-300",
      isOpen ? "w-72" : "w-20"
    )}>
      <div className={cn("p-4 border-b border-gray-800 flex items-center", isOpen ? "justify-between" : "justify-center")}>
        {isOpen && <span className="font-bold text-lg ml-2">{t('common.appName')}</span>}
        <Button variant="ghost" size="icon" onClick={onToggle} className="text-white hover:bg-gray-700">
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <NavMenu items={navItems} pathname={location.pathname} isOpen={isOpen} />
      </nav>
    </aside>
  );
}
`;
  fs.writeFileSync(path.join(dir, "Sidebar.tsx"), content, "utf8");
  console.log("✅ Generated responsive Sidebar component with smart, translatable links.");
}