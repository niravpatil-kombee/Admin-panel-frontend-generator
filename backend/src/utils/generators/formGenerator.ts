// src/utils/generators/formGenerator.ts
import fs from "fs";
import path from "path";
import { Field, ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// --- All helper functions are correct and unchanged ---

// UPDATED: Zod validation is now smarter about the edit context
function generateZodValidation(field: Field): string {
  let zodChain = "";
  switch (field.zodType) {
    case "string":
      zodChain = "z.string()";
      break;
    case "number":
      zodChain = "z.number()";
      break;
    case "boolean":
      zodChain = "z.boolean()";
      break;
    case "date":
      zodChain = "z.date()";
      break;
    default:
      zodChain = "z.any()";
  }
  field.validationRules.forEach((rule) => {
    switch (rule.type) {
      case "required":
        if (field.zodType === "string") {
          zodChain += `.min(1, { message: "${rule.message}" })`;
        }
        break;
      case "minLength":
        if (field.zodType === "string") {
          zodChain += `.min(${rule.value}, { message: "${rule.message}" })`;
        }
        break;
      case "maxLength":
        if (field.zodType === "string") {
          zodChain += `.max(${rule.value}, { message: "${rule.message}" })`;
        }
        break;
      case "min":
        if (field.zodType === "number") {
          zodChain += `.min(${rule.value}, { message: "${rule.message}" })`;
        }
        break;
      case "max":
        if (field.zodType === "number") {
          zodChain += `.max(${rule.value}, { message: "${rule.message}" })`;
        }
        break;
      case "email":
        if (field.zodType === "string") {
          zodChain += `.email({ message: "${rule.message}" })`;
        }
        break;
      case "url":
        if (field.zodType === "string") {
          zodChain += `.url({ message: "${rule.message}" })`;
        }
        break;
    }
  });

  // NEW LOGIC: If a field is removed on edit, it MUST be optional in the Zod schema
  // to allow the "edit" form to validate successfully without submitting the field.
  if (field.isRemoveInEditForm) {
    return zodChain + ".optional()";
  }

  if (
    field.required &&
    !field.validationRules.some((r) => r.type === "required")
  ) {
    if (field.zodType === "string") {
      zodChain += '.min(1, "' + field.label + ' is required")';
    }
  }
  if (
    !field.required &&
    !field.validationRules.some((r) => r.type === "required")
  ) {
    zodChain += ".optional()";
  }
  return zodChain;
}

function generateDefaultValue(field: Field): string {
  if (field.zodType === "boolean") {
    return "false";
  }
  if (field.zodType === "number") {
    return "0";
  }
  if (field.zodType === "date") {
    return "undefined";
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
      const selectOptions = (
        field.options || ["Default Option 1", "Default Option 2"]
      )
        .map(
          (opt: string) =>
            `<SelectItem value="${opt
              .toLowerCase()
              .replace(/\\s+/g, "_")}">${opt}</SelectItem>`
        )
        .join("\n          ");
      control = `<Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl><SelectContent>${selectOptions}</SelectContent></Select>`;
      break;
    case "checkbox":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem className="flex items-center gap-x-3 space-y-0 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none">${commonLabel}</div></FormItem>)} />`;
    case "switch":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-6"><div className="space-y-0.5"><FormLabel>${field.label}</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />`;
    case "radio":
      const radioOptions = (field.options || ["Default A", "Default B"])
        .map(
          (opt: string) =>
            `<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="${opt
              .toLowerCase()
              .replace(
                /\\s+/g,
                "_"
              )}" /></FormControl><FormLabel className="font-normal">${opt}</FormLabel></FormItem>`
        )
        .join("\n        ");
      control = `<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 pt-2">${radioOptions}</RadioGroup>`;
      break;
    case "file":
      control = `<Input type="file" />`;
      break;
    case "color":
      control = `<Input type="color" {...field} />`;
      break;
    case "datepicker":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>${field.label}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />`;
    default:
      let inputType = "text";
      // Ensure password fields are correctly typed
      if (field.fieldName.toLowerCase().includes("password")) {
        inputType = "password";
      } else if (field.validationRules.some((r) => r.type === "email")) {
        inputType = "email";
      } else if (field.validationRules.some((r) => r.type === "url")) {
        inputType = "url";
      } else if (field.zodType === "number") {
        inputType = "number";
      }
      control = `<Input type="${inputType}" placeholder="${field.placeholder}" {...field} />`;
  }
  return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem>${commonLabel}<FormControl>${control}</FormControl><FormMessage /></FormItem>)} />`;
}

// MAIN FUNCTION 
export function generateFormComponent(
  modelName: string,
  modelConfig: ModelConfig
): void {
  const componentName = `${capitalize(modelName)}Form`;
  const outputDir = modelConfig.isPopup
    ? path.join(getBaseDir(), "src", "components", "forms")
    : path.join(getBaseDir(), "src", "pages", capitalize(modelName));

  // REMOVED: The pre-filtering logic is now gone.
  // const fieldsForForm = modelConfig.fields.filter(
  //   (field) => !field.isRemoveInEditForm
  // );

  const hasDatePicker = modelConfig.fields.some(
    (field) => field.uiType === "datepicker"
  );

  const zodSchemaFields = modelConfig.fields
    .map((field) => `  ${field.fieldName}: ${generateZodValidation(field)}`)
    .join(",\n");

  const defaultValues = modelConfig.fields
    .map((field) => `    ${field.fieldName}: ${generateDefaultValue(field)}`)
    .join(",\n");

  const componentContent = modelConfig.isPopup
    ? generatePopupFormComponent(
        modelName,
        componentName,
        zodSchemaFields,
        defaultValues,
        modelConfig.fields, // Pass all fields
        hasDatePicker
      )
    : generateRegularFormComponent(
        modelName,
        componentName,
        zodSchemaFields,
        defaultValues,
        modelConfig.fields, // Pass all fields
        hasDatePicker
      );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const newFilePath = path.join(outputDir, `${componentName}.tsx`);
  fs.writeFileSync(newFilePath, componentContent, "utf8");
  console.log(
    `✅ Generated ${
      modelConfig.isPopup ? "Popup Form" : "Page Form"
    } for ${modelName} at: ${newFilePath}`
  );
}

// UPDATED: Now accepts an array of fields and generates conditional JSX
function generatePopupFormComponent(
  modelName: string,
  componentName: string,
  zodSchema: string,
  defaultValues: string,
  fields: Field[],
  hasDatePicker: boolean
): string {
  const typeName = `${capitalize(modelName)}FormValues`;

  const mainFormFields = fields
    .map(field => {
      const fieldJsx = generateFormField(field);
      // If the field is marked to be removed in edit forms, wrap it in a conditional render block.
      // It will only render if `initialData` (and thus an ID) does NOT exist, meaning we are in "create" mode.
      if (field.isRemoveInEditForm) {
        return `          {!initialData?.id && (
            <>${fieldJsx}</>
          )}`;
      }
      return `          ${fieldJsx}`;
    })
    .join("\n\n");

  const dateImports = hasDatePicker
    ? `
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";`
    : "";

  return `
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
${dateImports}
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// Zod validation schema generated from Excel validation rules
const ${modelName}Schema = z.object({
${zodSchema}
});

type ${capitalize(modelName)}FormValues = z.infer<typeof ${modelName}Schema>;

interface ${componentName}Props {
  // Make initialData's id optional to differentiate create/edit
  initialData?: Partial<${capitalize(modelName)}FormValues> & { id?: any };
  onSubmit: (values: ${capitalize(modelName)}FormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ${componentName}({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ${componentName}Props) {
  const form = useForm<${capitalize(modelName)}FormValues>({
    resolver: zodResolver(${modelName}Schema),
    defaultValues: {
${defaultValues},
      ...initialData
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
${mainFormFields}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
`;
}

// UPDATED: Now accepts an array of fields and generates conditional JSX for regular pages
function generateRegularFormComponent(
  modelName: string,
  componentName: string,
  zodSchema: string,
  defaultValues: string,
  fields: Field[],
  hasDatePicker: boolean
): string {
  const typeName = `${capitalize(modelName)}FormValues`;

  const mainFormFields = fields
    .map(field => {
      const fieldJsx = generateFormField(field);
      // If the field is marked to be removed in edit forms, wrap it in a conditional render block.
      // It will only render if the URL does NOT contain an ID, meaning we are in "create" mode.
      if (field.isRemoveInEditForm) {
        return `            {!id && (
              <>${fieldJsx}</>
            )}`;
      }
      return `            ${fieldJsx}`;
    })
    .join("\n\n");

  const dateImports = hasDatePicker
    ? `
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";`
    : "";

  return `
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams } from "react-router-dom"; // Import useParams
${dateImports}
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// Zod validation schema generated from Excel validation rules
const ${modelName}Schema = z.object({
${zodSchema}
});

type ${capitalize(modelName)}FormValues = z.infer<typeof ${modelName}Schema>;

export function ${componentName}() {
  const { id } = useParams<{ id: string }>(); // Get ID from URL for context

  const form = useForm<${capitalize(modelName)}FormValues>({
    resolver: zodResolver(${modelName}Schema),
    defaultValues: {
${defaultValues}
      // TODO: Fetch and populate initialData for edit pages
    },
  });

  function onSubmit(values: ${capitalize(modelName)}FormValues) {
    console.log("Form Submitted:", values);
    // TODO: Implement your form submission logic here
  }

  return (
    <div className="w-full bg-card border rounded-xl shadow-sm">
      <div className="p-6 md:p-8 border-b">
        <h1 className="text-2xl font-bold text-foreground">{id ? 'Edit' : 'Create'} ${capitalize(
          modelName
        )}</h1>
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
}