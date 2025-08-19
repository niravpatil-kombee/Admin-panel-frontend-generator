// src/utils/generators/formGenerator.ts

import fs from "fs";
import path from "path";
import { Field } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function generateFormField(field: Field): string {
    const commonLabel = `<FormLabel>${field.label}</FormLabel>`;
    const commonDescription = field.description ? `<FormDescription>${field.description}</FormDescription>` : '';
    let control: string;
    switch (field.uiType) {
        case 'textarea':
            control = `<Textarea placeholder="${field.placeholder}" {...field} />`;
            break;
        case 'select':
            control = `<Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl><SelectContent>${field.options?.map(opt => `<SelectItem value="${opt}">${opt}</SelectItem>`).join("\n") || ''}</SelectContent></Select>`;
            break;
        case 'checkbox':
            return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem><div className="space-y-2">${commonLabel}</div><FormControl><div className="h-10 flex items-center"><Checkbox checked={field.value} onCheckedChange={field.onChange} /></div></FormControl>${commonDescription}<FormMessage /></FormItem>)} />`;
        case 'radio':
            control = `<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 pt-2">${field.options?.map(opt => `<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="${opt}" /></FormControl><FormLabel className="font-normal">${opt}</FormLabel></FormItem>`).join("\n") || ''}</RadioGroup>`;
            break;
        case 'file':
            control = `<Input type="file" {...form.register("${field.fieldName}")} />`;
            return `<FormField control={form.control} name="${field.fieldName}" render={() => (<FormItem>${commonLabel}<FormControl>${control}</FormControl>${commonDescription}<FormMessage /></FormItem>)} />`;
        default:
            control = `<Input placeholder="${field.placeholder}" {...field} />`;
    }
    return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem>${commonLabel}<FormControl>${control}</FormControl>${commonDescription}<FormMessage /></FormItem>)} />`;
}

export function generateFormComponent(modelName: string, fields: Field[]): void {
  const componentName = `${capitalize(modelName)}Form`;

  // --- UPDATED: Output directory is now model-specific inside src/pages ---
  const modelDirName = capitalize(modelName); // e.g., "User"
  const outputDir = path.join(getBaseDir(), "src", "pages", modelDirName);

  const splitIndex = Math.max(0, fields.length - 3);
  const mainFields = fields.slice(0, splitIndex);
  const lastRowFields = fields.slice(splitIndex);

  const mainFormFields = mainFields.map(generateFormField).join("\n\n                    ");
  const lastRowFormFields = lastRowFields.map(generateFormField).join("\n\n                    ");

  const componentContent = `
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export function ${componentName}() {
  const form = useForm<any>();

  function onSubmit(values: any) {
    console.log("Form Submitted:", values);
  }

  return (
    <div className="w-full bg-card border rounded-xl shadow-sm">
        <div className="p-6 md:p-8 border-b">
            <h1 className="text-2xl font-bold text-foreground">Manage ${capitalize(modelName)}</h1>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${mainFormFields}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${lastRowFormFields}
                </div>
                <div className="flex justify-center md:justify-end pt-8">
                    <Button type="submit" size="lg">
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}
`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const newFilePath = path.join(outputDir, `${componentName}.tsx`);
  fs.writeFileSync(newFilePath, componentContent, "utf8");
  console.log(`✅ Generated Form for ${modelName} at: ${newFilePath}`);
}