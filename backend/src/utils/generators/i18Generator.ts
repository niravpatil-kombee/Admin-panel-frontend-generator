import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateI18n(modelNames: string[]): void {
  const i18nDir = path.join(getBaseDir(), "src", "i18n");
  const localesDir = path.join(i18nDir, "locales");
  const enDir = path.join(localesDir, "en");
  const frDir = path.join(localesDir, "fr");
  const arDir = path.join(localesDir, "ar");

  // Create directories
  [i18nDir, localesDir, enDir, frDir, arDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // Empty translation structure
  const emptyTranslation = {
    common: {},
    sidebar: {},
    table: {},
    form: {},
    login: {},
    models: {},
  };

  // Write empty JSON files
  fs.writeFileSync(
    path.join(enDir, "translation.json"),
    JSON.stringify(emptyTranslation, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(frDir, "translation.json"),
    JSON.stringify(emptyTranslation, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(arDir, "translation.json"),
    JSON.stringify(emptyTranslation, null, 2),
    "utf8"
  );

  // --- File 3: The i18next Configuration (index.ts) ---
  const i18nConfigContent = `
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import arTranslation from './locales/ar/translation.json';

const resources = {
  en: { translation: enTranslation },
  fr: { translation: frTranslation },
  ar: { translation: arTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already does this
    },
  });

  // Set text direction and html lang when language changes
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    const isRtl = lng === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  }
});

// Apply initial direction on load
if (typeof document !== 'undefined') {
  const initialLng = i18n.language || 'en';
  const isRtl = initialLng === 'ar';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = initialLng;
}

export default i18n;
`;
  fs.writeFileSync(path.join(i18nDir, "index.ts"), i18nConfigContent, "utf8");
  console.log(`✅ Generated comprehensive i18next setup in src/i18n`);
}
