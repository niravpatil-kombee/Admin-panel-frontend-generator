// src/utils/generators/headerGenerator.ts
import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateHeader(): void {
  const dir = path.join(getBaseDir(), "src", "components", "layout");
  const content = `
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ChevronRight } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher"; 
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  onMenuClick: () => void;
}

const createBreadcrumbLabel = (segment: string, t: (key: string) => string): string => {
  if (!segment) return "";
  // Check if a translation key exists for the model
  const modelKey = \`models.\${segment.replace(/s$/, '')}\`;
  if (t(modelKey) !== modelKey) {
    return t(modelKey);
  }
  return segment.replace(/-/g, ' ').replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const { t } = useTranslation();

  const breadcrumbs = React.useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const crumbs = [{ label: t('common.dashboard'), href: "/" }];

    let currentPath = "";
    pathParts.forEach((part) => {
      currentPath += \`/\${part}\`;
      crumbs.push({
        label: createBreadcrumbLabel(part, t),
        href: currentPath,
      });
    });
    
    return crumbs;
  }, [location.pathname, t]);

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu />
        </Button>
        <nav className="flex items-center text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
              <Link
                to={crumb.href}
                className={index === breadcrumbs.length - 1 ? "font-semibold text-foreground pointer-events-none" : "hover:text-foreground transition-colors"}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
`;
  fs.writeFileSync(path.join(dir, "Header.tsx"), content, "utf8");
  console.log("✅ Generated Header component with i18n breadcrumbs.");
}