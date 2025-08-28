import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateI18n(modelNames: string[]): void {
  const i18nDir = path.join(getBaseDir(), "src", "i18n");
  const localesDir = path.join(i18nDir, "locales");
  const enDir = path.join(localesDir, "en");
  const frDir = path.join(localesDir, "fr"); // Example: French

  // Create directories
  [i18nDir, localesDir, enDir, frDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // Dynamically generate model translation keys
  const modelsEn = modelNames.reduce((acc, name) => {
    const lower = name.toLowerCase();
    const cap = capitalize(name);
    acc[lower] = cap;
    acc[`${lower}_plural`] = `${cap}s`;
    return acc;
  }, {} as Record<string, string>);

  const modelsFr = modelNames.reduce((acc, name) => {
    const lower = name.toLowerCase();
    const cap = capitalize(name);
    // NOTE: These would be actual French translations in a real project
    acc[lower] = cap;
    acc[`${lower}_plural`] = `${cap}s`; // French plurals can be complex, this is a simplification
    return acc;
  }, {} as Record<string, string>);

  // --- File 1: English Translations (Comprehensive) ---
  const enTranslation = {
    common: {
      appName: "Admin Panel",
      dashboard: "Dashboard",
      all: "All",
      create: "Create",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      actions: "Actions",
      import: "Import",
      export: "Export",
      new: "New",
      areYouSure: "Are you sure?",
      areYouSureDescription: "This action cannot be undone.",
      continue: "Continue",
      noResults: "No results.",
      previous: "Previous",
      next: "Next",
      selected: "{{count}} of {{total}} selected.",
      pickADate: "Pick a date",
      dragAndDrop: "Drag & drop a file, or click to select",
    },
    sidebar: {
      allModels: "All {{model}}", // e.g., "All Users"
      createModel: "Create {{model}}", // e.g., "Create User"
    },
    table: {
      manageTitle: "Manage {{model}}", // e.g., "Manage Users"
      deleteSelected: "Delete ({{count}})",
    },
    form: {
      createTitle: "Create {{model}}", // e.g., "Create User"
      editTitle: "Edit {{model}}", // e.g., "Edit User"
      viewTitle: "{{model}} Details", // e.g., "User Details"
    },
    login: {
      title: "Login",
      description: "Enter your email below to login to your account.",
      emailLabel: "Email",
      passwordLabel: "Password",
      signInButton: "Sign In",
      signUpPrompt: "Don't have an account?",
      signUpLink: "Sign up",
    },
    models: modelsEn,
  };
  fs.writeFileSync(path.join(enDir, "translation.json"), JSON.stringify(enTranslation, null, 2), "utf8");

  // --- File 2: French Translations (Comprehensive) ---
  const frTranslation = {
    // NOTE: This is a partial translation for demonstration
    common: {
      appName: "Panneau d'administration",
      dashboard: "Tableau de bord",
      all: "Tous",
      create: "Créer",
      edit: "Modifier",
      delete: "Supprimer",
      view: "Voir",
      save: "Enregistrer",
      saving: "Enregistrement...",
      cancel: "Annuler",
      actions: "Actions",
      import: "Importer",
      export: "Exporter",
      new: "Nouveau",
      areYouSure: "Êtes-vous sûr?",
      areYouSureDescription: "Cette action est irréversible.",
      continue: "Continuer",
      noResults: "Aucun résultat.",
      previous: "Précédent",
      next: "Suivant",
      selected: "{{count}} de {{total}} sélectionnés.",
      pickADate: "Choisissez une date",
      dragAndDrop: "Glissez-déposez un fichier, ou cliquez pour sélectionner",
    },
    sidebar: {
      allModels: "Tous les {{model}}",
      createModel: "Créer un {{model}}",
    },
    table: {
      manageTitle: "Gérer les {{model}}",
      deleteSelected: "Supprimer ({{count}})",
    },
    form: {
      createTitle: "Créer un {{model}}",
      editTitle: "Modifier un {{model}}",
      viewTitle: "Détails de {{model}}",
    },
    login: {
      title: "Connexion",
      description: "Entrez votre email pour vous connecter.",
      emailLabel: "Email",
      passwordLabel: "Mot de passe",
      signInButton: "Se connecter",
      signUpPrompt: "Pas de compte?",
      signUpLink: "S'inscrire",
    },
    models: modelsFr,
  };
  fs.writeFileSync(path.join(frDir, "translation.json"), JSON.stringify(frTranslation, null, 2), "utf8");

  // --- File 3: The i18next Configuration (index.ts) ---
  const i18nConfigContent = `
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';

const resources = {
  en: { translation: enTranslation },
  fr: { translation: frTranslation },
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

export default i18n;
`;
  fs.writeFileSync(path.join(i18nDir, "index.ts"), i18nConfigContent, "utf8");
  console.log(`✅ Generated comprehensive i18next setup in src/i18n`);
}