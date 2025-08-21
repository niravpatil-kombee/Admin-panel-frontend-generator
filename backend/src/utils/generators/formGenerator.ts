// src/utils/generators/formGenerator.ts
import fs from "fs";
import path from "path";
import { Field } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);


// NEW: Function to generate Zod schema from validation rules
function generateZodValidation(field: Field): string {
  let zodChain = '';
  
  // Start with base type
  switch (field.zodType) {
    case 'string':
      zodChain = 'z.string()';
      break;
    case 'number':
      zodChain = 'z.number()';
      break;
    case 'boolean':
      zodChain = 'z.boolean()';
      break;
    case 'date':
      zodChain = 'z.date()';
      break;
    default:
      zodChain = 'z.any()';
  }

  // Apply validation rules
  field.validationRules.forEach(rule => {
    switch (rule.type) {
      case 'required':
        if (field.zodType === 'string') {
            zodChain += `.min(1, { message: "${rule.message}" })`;
        }
        break;
      // UPDATED: These rules are now inside a check to ensure they only apply to strings and numbers
      case 'minLength':
        if (field.zodType === 'string') {
            zodChain += `.min(${rule.value}, { message: "${rule.message}" })`;
        }
        break;
      case 'maxLength':
        if (field.zodType === 'string') {
            zodChain += `.max(${rule.value}, { message: "${rule.message}" })`;
        }
        break;
      case 'min':
        if (field.zodType === 'number') {
            zodChain += `.min(${rule.value}, { message: "${rule.message}" })`;
        }
        break;
      case 'max':
        if (field.zodType === 'number') {
            zodChain += `.max(${rule.value}, { message: "${rule.message}" })`;
        }
        break;
      case 'email':
        if (field.zodType === 'string') {
            zodChain += `.email({ message: "${rule.message}" })`;
        }
        break;
      case 'url':
        if (field.zodType === 'string') {
            zodChain += `.url({ message: "${rule.message}" })`;
        }
        break;
    }
  });

  // Handle required fields that don't have explicit required validation rule
  if (field.required && !field.validationRules.some(r => r.type === 'required')) {
    if (field.zodType === 'string') {
      zodChain += '.min(1, "' + field.label + ' is required")';
    }
  }

  // For optional fields, make them optional if not required
  if (!field.required && !field.validationRules.some(r => r.type === 'required')) {
    zodChain += '.optional()';
  }

  return zodChain;
}

// NEW: Function to generate default values based on field type
function generateDefaultValue(field: Field): string {
  if (field.zodType === 'boolean') {
    return 'false';
  }
  if (field.zodType === 'number') {
    return '0';
  }
  if (field.zodType === 'date') {
    return 'undefined';
  }
  return '""';
}


function generateFormField(field: Field): string {
  const commonLabel = `<FormLabel>${field.label}</FormLabel>`;
  let control: string;

  switch (field.uiType) {
    case "textarea":
      control = `<Textarea placeholder="${field.placeholder}" {...field} />`;
      break;

    case "select":
      const selectOptions = (field.options || ["Default Option 1", "Default Option 2"])
        .map((opt: string) => `<SelectItem value="${opt.toLowerCase().replace(/\\s+/g, '_')}">${opt}</SelectItem>`)
        .join("\n          ");

      control = `<Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          ${selectOptions}
        </SelectContent>
      </Select>`;
      break;

    case "checkbox":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
        <FormItem className="flex items-center gap-x-3 space-y-0 pt-8">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              ${commonLabel}
            </div>
        </FormItem>
      )} />`;

    case "switch":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-6">
          <div className="space-y-0.5">
            <FormLabel>${field.label}</FormLabel>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )} />`;

    case "radio":
      const radioOptions = (field.options || ["Default A", "Default B"])
        .map((opt: string) => 
              `<FormItem className="flex items-center space-x-2 space-y-0">
          <FormControl><RadioGroupItem value="${opt.toLowerCase().replace(/\\s+/g, '_')}" /></FormControl>
          <FormLabel className="font-normal">${opt}</FormLabel>
        </FormItem>`
            ).join("\n        ");

      control = `<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 pt-2">
        ${radioOptions}
      </RadioGroup>`;
      break;

    case "file":
      control = `<Input type="file" />`; // Simplified for basic form
      break;

    case "color":
      control = `<Input type="color" {...field} />`;
      break;

    case "datepicker":
      return `<FormField
        control={form.control}
        name="${field.fieldName}"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>${field.label}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />`;

      default:
        // Apply input type based on validation rules
        let inputType = 'text';
        if (field.validationRules.some(r => r.type === 'email')) {
          inputType = 'email';
        } else if (field.validationRules.some(r => r.type === 'url')) {
          inputType = 'url';
        } else if (field.zodType === 'number') {
          inputType = 'number';
        }
        
        control = `<Input type="${inputType}" placeholder="${field.placeholder}" {...field} />`;
    }

  return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
    <FormItem>
      ${commonLabel}
      <FormControl>${control}</FormControl>
      <FormMessage />
    </FormItem>
  )} />`;
}

export function generateFormComponent(modelName: string, fields: Field[]): void {
  const componentName = `${capitalize(modelName)}Form`;
  const modelDirName = capitalize(modelName);
  const outputDir = path.join(getBaseDir(), "src", "pages", modelDirName);

  const mainFormFields = fields
    .filter(field => !field.isRemoveInEditForm) // Exclude fields marked for removal in edit form
    .map(generateFormField)
    .join("\n\n          ");

  // NEW: Generate Zod schema
  const zodSchema = fields
    .filter(field => !field.isRemoveInEditForm)
    .map(field => `  ${field.fieldName}: ${generateZodValidation(field)}`)
    .join(",\n");

  // NEW: Generate default values
  const defaultValues = fields
    .filter(field => !field.isRemoveInEditForm)
    .map(field => `    ${field.fieldName}: ${generateDefaultValue(field)}`)
    .join(",\n");

  const componentContent = `
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Zod validation schema generated from Excel validation rules
const ${modelName}Schema = z.object({
${zodSchema}
});

type ${capitalize(modelName)}FormValues = z.infer<typeof ${modelName}Schema>;

export function ${componentName}() {
  const form = useForm<${capitalize(modelName)}FormValues>({
    resolver: zodResolver(${modelName}Schema),
    defaultValues: {
${defaultValues}
    },
  });

  function onSubmit(values: ${capitalize(modelName)}FormValues) {
    console.log("Form Submitted:", values);
    // TODO: Implement your form submission logic here
  }

  return (
    <div className="w-full bg-card border rounded-xl shadow-sm">
      <div className="p-6 md:p-8 border-b">
        <h1 className="text-2xl font-bold text-foreground">Manage ${capitalize(modelName)}</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
            ${mainFormFields}
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg">Save Changes</Button>
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