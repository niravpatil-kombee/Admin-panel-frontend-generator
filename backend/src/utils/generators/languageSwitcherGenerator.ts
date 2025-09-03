import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateLanguageSwitcher(): void {
  const componentsDir = path.join(getBaseDir(), "src", "layout");
  if (!fs.existsSync(componentsDir)) fs.mkdirSync(componentsDir, { recursive: true });

  const switcherPath = path.join(componentsDir, "LanguageSwitcher.tsx");
  const switcherContent = `
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = languages.find(lang => lang.code === i18n.resolvedLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative h-9 w-9 sm:h-10 sm:w-10"
          title={currentLanguage.name}
        >
          <Languages className="h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
          Select Language
        </div>
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code} 
            onClick={() => i18n.changeLanguage(lang.code)} 
            disabled={i18n.resolvedLanguage === lang.code}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {i18n.resolvedLanguage === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
`;
  fs.writeFileSync(switcherPath, switcherContent, "utf8");
  console.log(`✅ Generated responsive LanguageSwitcher component.`);
}