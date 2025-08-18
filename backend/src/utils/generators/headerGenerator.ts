// src/utils/generators/headerGenerator.ts
import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateHeader(): void {
  const dir = path.join(getBaseDir(), "src", "components", "layout");
  const content = `
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

function formatPathname(pathname: string): string {
    if (pathname === "/") return "Dashboard";
    const pathParts = pathname.split('/').filter(Boolean);
    return pathParts.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const title = formatPathname(location.pathname);

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center gap-4">
        {/* Mobile menu button, only shown on small screens */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu />
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
`;
  fs.writeFileSync(path.join(dir, "Header.tsx"), content, "utf8");
  console.log("✅ Generated Header component with mobile toggle.");
}