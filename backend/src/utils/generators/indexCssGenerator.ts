// src/utils/generators/indexCssGenerator.ts

import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateIndexCss(): void {
  const cssContent = `
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  --radius: 0.5rem;
  --background: oklch(0.982 0.006 255.51);
  --foreground: oklch(0.198 0.038 263.85);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.198 0.038 263.85);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.198 0.038 263.85);
  --primary: oklch(0.518 0.178 253.53);
  --primary-foreground: oklch(0.984 0.003 247.858);
  --secondary: oklch(0.941 0.011 254.34);
  --secondary-foreground: oklch(0.198 0.038 263.85);
  --muted: oklch(0.941 0.011 254.34);
  --muted-foreground: oklch(0.534 0.046 257.42);
  --accent: oklch(0.941 0.011 254.34);
  --accent-foreground: oklch(0.198 0.038 263.85);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.916 0.015 253.92);
  --input: oklch(0.916 0.015 253.92);
  --ring: oklch(0.518 0.178 253.53);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.984 0.003 247.858);
  --sidebar-foreground: oklch(0.129 0.042 264.695);
  --sidebar-primary: oklch(0.208 0.042 265.755);
  --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
  --sidebar-accent: oklch(0.968 0.007 247.896);
  --sidebar-accent-foreground: oklch(0.208 0.042 265.755);
  --sidebar-border: oklch(0.929 0.013 255.508);
  --sidebar-ring: oklch(0.704 0.04 256.788);
}

.dark {
  --background: oklch(0.129 0.042 264.695);
  --foreground: oklch(0.984 0.003 247.858);
  --card: oklch(0.208 0.042 265.755);
  --card-foreground: oklch(0.984 0.003 247.858);
  --popover: oklch(0.208 0.042 265.755);
  --popover-foreground: oklch(0.984 0.003 247.858);
  --primary: oklch(0.929 0.013 255.508);
  --primary-foreground: oklch(0.208 0.042 265.755);
  --secondary: oklch(0.279 0.041 260.031);
  --secondary-foreground: oklch(0.984 0.003 247.858);
  --muted: oklch(0.279 0.041 260.031);
  --muted-foreground: oklch(0.704 0.04 256.788);
  --accent: oklch(0.279 0.041 260.031);
  --accent-foreground: oklch(0.984 0.003 247.858);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.551 0.027 264.364);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.208 0.042 265.755);
  --sidebar-foreground: oklch(0.984 0.003 247.858);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
  --sidebar-accent: oklch(0.279 0.041 260.031);
  --sidebar-accent-foreground: oklch(0.984 0.003 247.858);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.551 0.027 264.364);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  
  html {
    @apply scroll-smooth;
  }
  
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Responsive typography */
  h1 {
    @apply text-2xl sm:text-3xl lg:text-4xl font-bold;
  }
  
  h2 {
    @apply text-xl sm:text-2xl lg:text-3xl font-semibold;
  }
  
  h3 {
    @apply text-lg sm:text-xl lg:text-2xl font-medium;
  }
  
  /* Mobile-first responsive utilities */
  .container {
    @apply mx-auto px-4 sm:px-6 lg:px-8;
    max-width: 1280px;
  }
  
  /* Improved focus styles for accessibility */
  .focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
  
  /* Smooth transitions for interactive elements */
  .transition-all {
    @apply transition-all duration-200 ease-in-out;
  }
  
  /* Mobile-specific styles */
  @media (max-width: 640px) {
    .mobile-hidden {
      @apply hidden;
    }
    
    .mobile-block {
      @apply block;
    }
    
    .mobile-text-sm {
      @apply text-sm;
    }
    
    .mobile-p-4 {
      @apply p-4;
    }
  }
  
  /* Tablet-specific styles */
  @media (min-width: 641px) and (max-width: 1024px) {
    .tablet-hidden {
      @apply hidden;
    }
    
    .tablet-block {
      @apply block;
    }
  }
  
  /* Desktop-specific styles */
  @media (min-width: 1025px) {
    .desktop-hidden {
      @apply hidden;
    }
    
    .desktop-block {
      @apply block;
    }
  }
  
  /* Improved scrollbar styles */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-muted;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/20 rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/30;
  }
  
  /* Print styles */
  @media print {
    .no-print {
      @apply hidden;
    }
    
    body {
      @apply bg-white text-black;
    }
  }
}

@layer components {
  /* Custom component styles */
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary;
  }
  
  .btn-secondary {
    @apply bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary;
  }
  
  .card-hover {
    @apply hover:shadow-lg transition-shadow duration-200;
  }
  
  .input-focus {
    @apply focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
  }
  
  /* Responsive grid utilities */
  .grid-responsive {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4;
  }
  
  .grid-responsive-2 {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
  }
  
  /* Mobile-first spacing utilities */
  .space-y-responsive {
    @apply space-y-4 sm:space-y-6 lg:space-y-8;
  }
  
  .p-responsive {
    @apply p-4 sm:p-6 lg:p-8;
  }
  
  .px-responsive {
    @apply px-4 sm:px-6 lg:px-8;
  }
  
  .py-responsive {
    @apply py-4 sm:py-6 lg:py-8;
  }
}

@layer utilities {
  /* Custom utility classes */
  .text-balance {
    text-wrap: balance;
  }
  
  .text-pretty {
    text-wrap: pretty;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Animation utilities */
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
  
  .animate-slide-down {
    animation: slideDown 0.3s ease-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
`;
  const indexCssPath = path.join(getBaseDir(), "src", "index.css");
  fs.writeFileSync(indexCssPath, cssContent);
  console.log("✅ Generated responsive index.css with custom theme variables and utilities.");
}