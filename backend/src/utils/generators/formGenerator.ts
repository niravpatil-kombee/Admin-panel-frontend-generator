// src/utils/generators/formGenerator.ts
import fs from "fs";
import path from "path";
import { Field, ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// --- HELPER FUNCTIONS ---

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
    default: // Catches 'any' for file uploads
      zodChain = "z.any()";
  }

  field.validationRules.forEach((rule) => {
    switch (rule.type) {
      case "required":
        if (field.zodType === "string") {
          zodChain += `.min(1, { message: "${rule.message}" })`;
        }
        if (field.zodType === "any") {
          zodChain += `.refine(file => file, { message: "${rule.message}" })`;
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

  if (field.isRemoveInEditForm) {
    return zodChain + ".optional()";
  }

  if (
    field.required &&
    !field.validationRules.some((r) => r.type === "required")
  ) {
    if (field.zodType === "string") {
      zodChain += `.min(1, "${field.label} is required")`;
    }
    if (field.zodType === "any") {
      zodChain += `.refine(file => file, { message: "${field.label} is required." })`;
    }
  }
  if (
    !field.required &&
    !field.validationRules.some((r) => r.type === "required")
  ) {
    zodChain += ".optional().nullable()";
  }
  return zodChain;
}

function generateDefaultValue(field: Field): string {
  if (field.zodType === "boolean") return "false";
  if (field.zodType === "number") return "0";
  if (field.zodType === "date") return "undefined";
  if (field.zodType === "any") return "null";
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
      const selectOptions = (field.options || ["Default 1", "Default 2"])
        .map((opt) => `<SelectItem value="${opt.toLowerCase().replace(/\s+/g, "_")}">${opt}</SelectItem>`)
        .join("\n          ");

      const onChangeLogic = field.zodType === 'number'
        ? `(val) => field.onChange(Number(val))`
        : `field.onChange`;

      const valueLogic = field.zodType === 'number'
        ? `String(field.value ?? '')`
        : `field.value`;

      control = `<Select onValueChange={${onChangeLogic}} value={${valueLogic}}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="${field.placeholder}" /></SelectTrigger></FormControl><SelectContent>${selectOptions}</SelectContent></Select>`;
      break;
    case "checkbox":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem className="flex items-center gap-x-3 space-y-0 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none">${commonLabel}</div></FormItem>)} />`;
    case "switch":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-6"><div className="space-y-0.5"><FormLabel>${field.label}</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />`;
    case "radio":
      const radioOptions = (field.options || ["Default A", "Default B"])
        .map((opt) => `<FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="${opt.toLowerCase().replace(/\s+/g, "_")}" /></FormControl><FormLabel className="font-normal">${opt}</FormLabel></FormItem>`)
        .join("\n        ");
      control = `<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4 pt-2">${radioOptions}</RadioGroup>`;
      break;
    case "file":
      // ✅ UPDATED: Now uses CloudUpload icon and has improved styling.
      const capFieldName = capitalize(field.fieldName);
      return `
<FormField
  control={form.control}
  name="${field.fieldName}"
  render={() => (
    <FormItem>
      ${commonLabel}
      <FormControl>
        <div
          {...getRootPropsFor${capFieldName}()}
          className={cn("flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-2 cursor-pointer transition", is${capFieldName}DragActive ? "border-primary bg-muted" : "border-muted-foreground/25")}
        >
          <input {...getInputPropsFor${capFieldName}()} />
          <CloudUpload className="h-10 w-10 text-muted-foreground mb-4" />
          {${field.fieldName}File ? (
            <div className="flex flex-col items-center text-center">
              {${field.fieldName}File.type.startsWith("image/") && 
                <img src={URL.createObjectURL(${field.fieldName}File)} alt="Preview" className="h-20 w-20 rounded-full object-cover mb-2" />
              }
              <p className="text-sm text-foreground">{${field.fieldName}File.name}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Drag & drop a file, or click to select</p>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>`;
    case "color":
      control = `<Input type="color" {...field} />`;
      break;
    case "datepicker":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem><FormLabel>${field.label}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />`;
    default:
      let inputType = "text";
      if (field.fieldName.toLowerCase().includes("password")) inputType = "password";
      else if (field.validationRules.some((r) => r.type === "email")) inputType = "email";
      else if (field.validationRules.some((r) => r.type === "url")) inputType = "url";
      else if (field.zodType === "number") inputType = "number";
      control = `<Input type="${inputType}" placeholder="${field.placeholder}" {...field} />`;
  }
  return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (<FormItem>${commonLabel}<FormControl>${control}</FormControl><FormMessage /></FormItem>)} />`;
}

function generateOnSubmitFunction(modelName: string, fileFields: Field[], isPopup: boolean): string {
    const typeName = `${capitalize(modelName)}FormValues`;
    if (fileFields.length === 0) {
      const body = isPopup 
        ? `    onSubmit(values);`
        : `    console.log("Form Submitted:", values);\n    // TODO: Implement submission logic`;
      return `  function ${isPopup ? 'handleFormSubmit' : 'onSubmit'}(values: ${typeName}) {\n${body}\n  }`;
    }
  
    const formDataLogic = fileFields.map(field => `
      if (${field.fieldName}File) {
        formData.append("${field.fieldName}", ${field.fieldName}File);
      } else if (values.${field.fieldName}) {
        formData.append("${field.fieldName}", values.${field.fieldName});
      }`).join('');
  
    const body = isPopup 
      ? `    onSubmit(formData);`
      : `    console.log("FormData ready:", formData);\n    // TODO: Implement submission logic`;
  
    return `  function ${isPopup ? 'handleFormSubmit' : 'onSubmit'}(values: ${typeName}) {
      const formData = new FormData();
      for (const key in values) {
        const value = values[key as keyof typeof values];
        if (${fileFields.map(f => `key === '${f.fieldName}'`).join(' || ')}) continue;
        if (value instanceof Date) formData.append(key, value.toISOString());
        else if (value !== null && value !== undefined) formData.append(key, String(value));
      }
      ${formDataLogic}
      ${body}
    }`;
  }

// --- MAIN GENERATOR FUNCTION ---

export function generateFormComponent(modelName: string, modelConfig: ModelConfig): void {
  const componentName = `${capitalize(modelName)}Form`;
  const outputDir = modelConfig.isPopup ? path.join(getBaseDir(), "src", "components", "forms") : path.join(getBaseDir(), "src", "pages", capitalize(modelName));

  const hasDatePicker = modelConfig.fields.some((f) => f.uiType === "datepicker");
  const hasFileUpload = modelConfig.fields.some((f) => f.uiType === "file");

  const zodSchemaFields = modelConfig.fields.map((f) => `  ${f.fieldName}: ${generateZodValidation(f)}`).join(",\n");
  const defaultValues = modelConfig.fields.map((f) => `    ${f.fieldName}: ${generateDefaultValue(f)}`).join(",\n");

  const componentContent = modelConfig.isPopup
    ? generatePopupFormComponent(modelName, componentName, zodSchemaFields, defaultValues, modelConfig.fields, hasDatePicker, hasFileUpload)
    : generateRegularFormComponent(modelName, componentName, zodSchemaFields, defaultValues, modelConfig.fields, hasDatePicker, hasFileUpload);

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, `${componentName}.tsx`), componentContent, "utf8");
  console.log(`✅ Generated ${modelConfig.isPopup ? "Popup Form" : "Page Form"} for ${modelName} at: ${path.join(outputDir, `${componentName}.tsx`)}`);
}

// --- TEMPLATE GENERATORS ---

function generatePopupFormComponent(modelName: string, componentName: string, zodSchema: string, defaultValues: string, fields: Field[], hasDatePicker: boolean, hasFileUpload: boolean): string {
    const typeName = `${capitalize(modelName)}FormValues`;
    const fileFields = fields.filter(f => f.uiType === 'file');
  
    const mainFormFields = fields.map(field => {
      const fieldJsx = generateFormField(field);
      if (field.isRemoveInEditForm) {
        return `          {!initialData?.id && (\n            <>${fieldJsx}</>\n          )}`;
      }
      return `          ${fieldJsx}`;
    }).join("\n\n");
  
    // ✅ UPDATED: Dynamic lucide-react icon imports
    const lucideIcons = [];
    if (hasFileUpload) lucideIcons.push('CloudUpload');
    if (hasDatePicker) lucideIcons.push('CalendarIcon');

    const imports = [
      `import { useForm } from "react-hook-form";`,
      `import { zodResolver } from "@hookform/resolvers/zod";`,
      `import * as z from "zod";`,
      hasFileUpload && `import { useState } from "react";`,
      hasFileUpload && `import { useDropzone } from "react-dropzone";`,
      hasDatePicker && `import { format } from "date-fns";`,
      lucideIcons.length > 0 && `import { ${lucideIcons.join(', ')} } from "lucide-react";`,
      hasDatePicker && `import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";`,
      hasDatePicker && `import { Calendar } from "@/components/ui/calendar";`,
      `import { cn } from "@/lib/utils";`,
      `import { Button } from "@/components/ui/button";`,
      `import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";`,
      `import { Input } from "@/components/ui/input";`,
      `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";`,
      `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";`,
      `import { Checkbox } from "@/components/ui/checkbox";`,
      `import { Switch } from "@/components/ui/switch";`,
      `import { Textarea } from "@/components/ui/textarea";`,
    ].filter(Boolean).join('\n');
  
    const stateHooks = fileFields.map(f => `  const [${f.fieldName}File, set${capitalize(f.fieldName)}File] = useState<File | null>(null);`).join('\n');
    const dropzoneHooks = fileFields.map(f => `
  const { getRootProps: getRootPropsFor${capitalize(f.fieldName)}, getInputProps: getInputPropsFor${capitalize(f.fieldName)}, isDragActive: is${capitalize(f.fieldName)}DragActive } = useDropzone({
    accept: { "image/*": [] }, // Consider making this configurable
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        set${capitalize(f.fieldName)}File(file);
        form.setValue("${f.fieldName}", file as any);
      }
    },
  });`).join('\n');
  
    return `${imports}
  
  const ${modelName}Schema = z.object({
  ${zodSchema}
  });
  
  type ${typeName} = z.infer<typeof ${modelName}Schema>;
  
  interface ${componentName}Props {
    initialData?: Partial<${typeName}> & { id?: any };
    onSubmit: (values: ${typeName} | FormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
  }
  
  export function ${componentName}({ initialData, onSubmit, onCancel, isLoading = false }: ${componentName}Props) {
  ${stateHooks}
    const form = useForm<${typeName}>({
      resolver: zodResolver(${modelName}Schema),
      defaultValues: {
  ${defaultValues},
        ...initialData,
      },
    });
  ${dropzoneHooks}
  
    ${generateOnSubmitFunction(modelName, fileFields, true)}
  
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  ${mainFormFields}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Form>
    );
  }`;
  }
  
  function generateRegularFormComponent(modelName: string, componentName: string, zodSchema: string, defaultValues: string, fields: Field[], hasDatePicker: boolean, hasFileUpload: boolean): string {
    const typeName = `${capitalize(modelName)}FormValues`;
    const fileFields = fields.filter(f => f.uiType === 'file');
  
    const mainFormFields = fields.map(field => {
      const fieldJsx = generateFormField(field);
      if (field.isRemoveInEditForm) {
        return `            {!id && (\n              <>${fieldJsx}</>\n            )}`;
      }
      return `            ${fieldJsx}`;
    }).join("\n\n");
  
    // ✅ UPDATED: Dynamic lucide-react icon imports
    const lucideIcons = [];
    if (hasFileUpload) lucideIcons.push('CloudUpload');
    if (hasDatePicker) lucideIcons.push('CalendarIcon');

    const imports = [
      `import { useForm } from "react-hook-form";`,
      `import { zodResolver } from "@hookform/resolvers/zod";`,
      `import * as z from "zod";`,
      `import { useParams } from "react-router-dom";`,
      hasFileUpload && `import { useState } from "react";`,
      hasFileUpload && `import { useDropzone } from "react-dropzone";`,
      hasDatePicker && `import { format } from "date-fns";`,
      lucideIcons.length > 0 && `import { ${lucideIcons.join(', ')} } from "lucide-react";`,
      hasDatePicker && `import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";`,
      hasDatePicker && `import { Calendar } from "@/components/ui/calendar";`,
      `import { cn } from "@/lib/utils";`,
      `import { Button } from "@/components/ui/button";`,
      `import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";`,
      `import { Input } from "@/components/ui/input";`,
      `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";`,
      `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";`,
      `import { Checkbox } from "@/components/ui/checkbox";`,
      `import { Switch } from "@/components/ui/switch";`,
      `import { Textarea } from "@/components/ui/textarea";`,
    ].filter(Boolean).join('\n');
    
    const stateHooks = fileFields.map(f => `  const [${f.fieldName}File, set${capitalize(f.fieldName)}File] = useState<File | null>(null);`).join('\n');
    const dropzoneHooks = fileFields.map(f => `
  const { getRootProps: getRootPropsFor${capitalize(f.fieldName)}, getInputProps: getInputPropsFor${capitalize(f.fieldName)}, isDragActive: is${capitalize(f.fieldName)}DragActive } = useDropzone({
    accept: { "image/*": [] }, // Consider making this configurable
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        set${capitalize(f.fieldName)}File(file);
        form.setValue("${f.fieldName}", file as any);
      }
    },
  });`).join('\n');
  
    return `${imports}
  
  const ${modelName}Schema = z.object({
  ${zodSchema}
  });
  
  type ${typeName} = z.infer<typeof ${modelName}Schema>;
  
  export function ${componentName}() {
    const { id } = useParams<{ id: string }>();
  ${stateHooks}
  
    const form = useForm<${typeName}>({
      resolver: zodResolver(${modelName}Schema),
      defaultValues: {
  ${defaultValues}
        // TODO: Fetch and populate initialData for edit pages
      },
    });
  ${dropzoneHooks}
  
    ${generateOnSubmitFunction(modelName, fileFields, false)}
  
    return (
      <div className="w-full bg-card border rounded-xl shadow-sm">
        <div className="p-6 md:p-8 border-b">
          <h1 className="text-2xl font-bold text-foreground">{id ? 'Edit' : 'Create'} ${capitalize(modelName)}</h1>
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
  }`;
  }