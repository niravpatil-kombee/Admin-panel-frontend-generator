// src/utils/generators/headerGenerator.ts
import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateHeader(): void {
  const dir = path.join(getBaseDir(), "src", "layout");
  const content = `
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ChevronRight, Home } from "lucide-react";
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
  return segment.replace(/-/g, ' ').replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const { t } = useTranslation();

  const breadcrumbs = React.useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const crumbs = [{ label: t('common.dashboard'), href: "/", icon: Home }];

    let currentPath = "";
    pathParts.forEach((part) => {
      // ✅ Ensure breadcrumb URLs are plural
      const urlPart = part;

    currentPath += \`/\${urlPart}\`;
      crumbs.push({
        label: createBreadcrumbLabel(part, t),
        href: currentPath,
      });
    });
    
    return crumbs;
  }, [location.pathname, t]);

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={onMenuClick}
          aria-label={t('common.toggleMenu')}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Desktop Breadcrumbs */}
        <nav className="hidden sm:flex items-center text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
              <Link
                to={crumb.href}
                className={cn(
                  "hover:text-foreground transition-colors",
                  index === breadcrumbs.length - 1 
                    ? "font-semibold text-foreground pointer-events-none" 
                    : "hover:underline"
                )}
              >
                {crumb.icon ? <crumb.icon className="h-4 w-4" /> : crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        {/* Mobile Breadcrumbs */}
        <nav className="sm:hidden flex items-center text-sm text-muted-foreground min-w-0">
          {breadcrumbs.length > 1 && (
            <div className="flex items-center gap-1 min-w-0">
              <Link
                to={breadcrumbs[breadcrumbs.length - 2]?.href || "/"}
                className="hover:text-foreground transition-colors hover:underline"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Link>
              <span className="font-semibold text-foreground truncate">
                {breadcrumbs[breadcrumbs.length - 1]?.label}
              </span>
            </div>
          )}
        </nav>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
        
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="sm:hidden" 
          onClick={onMenuClick}
          aria-label={t('common.menu')}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

// Helper function for conditional classes
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
`;
  fs.writeFileSync(path.join(dir, "Header.tsx"), content, "utf8");
  console.log("✅ Generated responsive Header component with mobile-friendly breadcrumbs.");
}