// src/utils/generators/dashboardGenerator.ts

import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// A map of keywords to lucide-react icon names
const iconKeywordMap: { [key: string]: string } = {
  user: "Users",
  product: "Package",
  order: "ShoppingCart",
  category: "Shapes",
  brand: "Award",
  voucher: "Gift",
  coupon: "Ticket",
  contact: "Phone",
  page: "FileText",
  template: "LayoutTemplate",
  admin: "UserCog",
  catalogue: "BookOpen",
  group: "UserCog",
  history: "History"
};

// A list of all icons we need to import
const allIcons = [...new Set(Object.values(iconKeywordMap))];

// Function to find the best icon for a given model name
const getIconForModel = (modelName: string): string => {
  const lowerModelName = modelName.toLowerCase();
  for (const keyword in iconKeywordMap) {
    if (lowerModelName.includes(keyword)) {
      return iconKeywordMap[keyword];
    }
  }
  return "LayoutGrid"; // Default icon
};

export function generateDashboard(modelNames: string[]): void {
  const pagesDir = path.join(getBaseDir(), "src", "pages");
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }

  const dashboardItems = modelNames.map(name => ({
    label: capitalize(name).replace(/_/g, ' '),
    href: `/${name.toLowerCase()}s`, // Link to the list page
    icon: getIconForModel(name),
  }));

  const componentContent = `
import React from "react";
import { Link } from "react-router-dom";
import { 
  Users, Package, ShoppingCart, Shapes, Award, Gift, Ticket, Phone, 
  FileText, LayoutTemplate, UserCog, BookOpen, History, LayoutGrid 
} from "lucide-react";

// Map of icon names to actual component references
const iconMap: { [key: string]: React.ElementType } = {
  ${allIcons.join(',\n  ')},
  LayoutGrid, // Ensure default is included
};

const dashboardItems = ${JSON.stringify(dashboardItems, null, 2)};

export default function Dashboard() {
  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dashboardItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <Link
              key={item.label}
              to={item.href}
              className="group flex flex-col items-center justify-center p-6 bg-card border rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                {Icon && <Icon className="h-8 w-8 text-primary" />}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{item.label}</h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
`;

  fs.writeFileSync(path.join(pagesDir, "Dashboard.tsx"), componentContent, "utf8");
  console.log("✅ Generated Dashboard component with quick links.");
}