// src/utils/formGenerator.ts

import fs from "fs";
import path from "path";
import { Field } from "./excelParser";

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}



// Generates the JSX for a single Shadcn form field
// This function remains unchanged as its logic is for UI generation.
function generateFormField(field: Field): string {
  const commonLabel = `<FormLabel>${field.label}</FormLabel>`;
  const commonDescription = field.description ? `<FormDescription>${field.description}</FormDescription>` : '';
  let control: string;

  switch (field.uiType) {
    case 'textarea':
      control = `<Textarea placeholder="${field.placeholder}" {...field} />`;
      break;
    case 'select':
      control = `<Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl><SelectTrigger><SelectValue placeholder="Select a ${field.label.toLowerCase()}" /></SelectTrigger></FormControl>
        <SelectContent>
          ${field.options?.map(opt => `<SelectItem value="${opt}">${opt}</SelectItem>`).join("\n          ") || `<SelectItem value="null" disabled>No options configured</SelectItem>`}
        </SelectContent>
      </Select>`;
      break;
    case 'checkbox': // For a 'switch'
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">${commonLabel}${commonDescription}</div>
          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />`;
    case 'radio':
      control = `<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
        ${field.options?.map(opt => `<FormItem className="flex items-center space-x-3 space-y-0">
          <FormControl><RadioGroupItem value="${opt}" /></FormControl>
          <FormLabel className="font-normal">${opt}</FormLabel>
        </FormItem>`).join("\n        ") || '<p>No options configured</p>'}
      </RadioGroup>`;
      break;
    case 'file':
      control = `<Input type="file" {...form.register("${field.fieldName}")} />`;
      break;
    case 'color':
      control = `<Input type="color" className="p-1 h-10 w-full" {...field} />`;
      break;
    default: // 'input'
      control = `<Input type="${field.zodType === 'number' ? 'number' : 'text'}" placeholder="${field.placeholder}" {...field} />`;
  }

  // Wrap the control in the standard FormField structure
  return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
    <FormItem>
      ${commonLabel}
      <FormControl>${control.includes('<Select') || control.includes('<RadioGroup') ? control : control}</FormControl>
      ${commonDescription}
      <FormMessage />
    </FormItem>
  )} />`;
}

// Assembles and writes the complete React component file
export function generateFormComponent(modelName: string, fields: Field[]): void {
  const componentName = `${capitalize(modelName)}Form`;
  const formFields = fields.map(generateFormField).join("\n\n");

  const imports = new Set<string>(['Input']);
  fields.forEach(f => {
    if (f.uiType === 'textarea') imports.add('Textarea');
    if (f.uiType === 'select') imports.add('Select, SelectContent, SelectItem, SelectTrigger, SelectValue');
    if (f.uiType === 'checkbox') imports.add('Checkbox');
    if (f.uiType === 'radio') imports.add('RadioGroup, RadioGroupItem');
  });

  const componentContent = `
"use client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// Client-side validation has been removed.

export function ${componentName}() {
  const form = useForm<any>({
    // No resolver is used.
    // TODO: Add default values for an 'edit' form if needed
  });
  
  // Register file inputs separately as they are uncontrolled
  form.register("user_picture");

  function onSubmit(values: any) {
    // WARNING: Form data is NOT validated. Ensure you have server-side validation.
    // TODO: Send 'values' to your API endpoint
    console.log("Form Submitted (NO VALIDATION):", values);
    alert("Form data has been logged to the console. NO client-side validation was performed.");
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 border rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Manage ${capitalize(modelName)}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          ${formFields}
          <Button type="submit" size="lg" className="w-full md:w-auto">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}
`;

  const outputDir = path.resolve(process.cwd(), "..", "frontend", "src", "components", "generated");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, `${componentName}.tsx`);
  fs.writeFileSync(outputPath, componentContent, "utf8");
  console.log(`✅ Successfully generated form component (no validation): ${outputPath}`);
}