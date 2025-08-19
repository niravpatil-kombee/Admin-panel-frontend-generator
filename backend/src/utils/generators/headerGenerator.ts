// src/utils/generators/headerGenerator.ts
import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateHeader(): void {
  const dir = path.join(getBaseDir(), "src", "components", "layout");
  const content = `
import { useLocation, Link } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu, ChevronRight } from "lucide-react";
import React from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

// Helper to create a user-friendly label from a URL path segment
const createBreadcrumbLabel = (segment: string): string => {
  if (!segment) return "";
  return segment
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/_/g, ' ') // Replace underscores with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' ');
};

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
 // Generate breadcrumbs from the pathname, memoized for performance
  const breadcrumbs = React.useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const crumbs = [{ label: "Dashboard", href: "/" }];

    let currentPath = "";
    // UPDATED: Logic to correctly generate breadcrumb links
    pathParts.forEach((part, index) => {
      // The href for the link should be the plural form for the first segment (the model)
      // if it's not the last part of the breadcrumb trail.
      // e.g., for '/user/create', the 'user' part links to '/users'.
      const href = (index === 0 && pathParts.length > 1)
        ? \`/\${part}s\`
        : \`\${currentPath}/\${part}\`;
      
      currentPath += \`/\${part}\`;
      
      crumbs.push({
        label: createBreadcrumbLabel(part),
        href: href,
      });
    });
    
    return crumbs;
  }, [location.pathname]);

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu />
        </Button>
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {/* Add separator icon for all but the first item */}
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
              
              {/* The last breadcrumb is the current page, so it's styled differently and not clickable */}
              <Link
                to={crumb.href}
                className={
                  index === breadcrumbs.length - 1
                    ? "font-semibold text-foreground pointer-events-none" // Style for the current page
                    : "hover:text-foreground transition-colors" // Style for parent links
                }
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
`;
  fs.writeFileSync(path.join(dir, "Header.tsx"), content, "utf8");
  console.log("✅ Generated Header component with breadcrumbs.");
}