import fs from "fs";
import path from "path";
import { Field, ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// --- HELPER FUNCTIONS ---

function generateZodValidation(field: Field, modelName: string): string {
  let zodChain = "";
  const singleModel = modelName.toLowerCase();
  
  // Check if this is an ID field and override the zodType to string
  const isIdField = field.fieldName.toLowerCase().includes('id') || field.fieldName.toLowerCase().endsWith('_id');
  
    // --- PHONE SPECIAL CASE ---
    if (field.fieldName.toLowerCase().includes("phone")) {
      const requiredKey = `t("${singleModel}.validation.${field.fieldName}Required")`;
      const invalidKey = `t("${singleModel}.validation.${field.fieldName}Invalid")`;
      return `z.string().refine(val => !val || isValidPhoneNumber(val), { message: ${invalidKey} })${
        field.required ? `.min(1, { message: ${requiredKey} })` : ".optional().nullable()"
      }`;
    }

  if (isIdField && field.zodType === "number") {
    zodChain = "z.string()";
  } else {
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
  }

  field.validationRules.forEach((rule) => {
    const displayKey = isIdField ? field.fieldName.replace(/_id$/, "") : field.fieldName;
    const translationKey = `t("${singleModel}.validation.${displayKey}${capitalize(rule.type)}")`;
        switch (rule.type) {
      case "required":
        if (field.zodType === "string" || isIdField) {
          zodChain += `.min(1, { message: ${translationKey} })`;
        }
        if (field.zodType === "date") {
          zodChain = `z.date({ required_error: ${translationKey} })`;
        }
        if (field.zodType === "any") {
          zodChain += `.refine((file) => file, { message: ${translationKey} })`;
        }
        break;
      case "minLength":
        if (field.zodType === "string" || isIdField) {
          const minTranslationKey = `t("${singleModel}.validation.${field.fieldName}Min")`;
          zodChain += `.min(${rule.value}, { message: ${minTranslationKey} })`;
        }
        break;
      case "maxLength":
        if (field.zodType === "string" || isIdField) {
          const maxTranslationKey = `t("${singleModel}.validation.${field.fieldName}Max")`;
          zodChain += `.max(${rule.value}, { message: ${maxTranslationKey} })`;
        }
        break;
      case "min":
        if (field.zodType === "number" && !isIdField) {
          zodChain += `.min(${rule.value}, { message: ${translationKey} })`;
        }
        break;
      case "max":
        if (field.zodType === "number" && !isIdField) {
          zodChain += `.max(${rule.value}, { message: ${translationKey} })`;
        }
        break;
      case "email":
        if (field.zodType === "string") {
          const emailTranslationKey = `t("${singleModel}.validation.${field.fieldName}Invalid")`;
          zodChain += `.email({ message: ${emailTranslationKey} })`;
        }
        break;
      case "url":
        if (field.zodType === "string") {
          const urlTranslationKey = `t("${singleModel}.validation.${field.fieldName}Invalid")`;
          zodChain += `.url({ message: ${urlTranslationKey} })`;
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
    const requiredTranslationKey = `t("${singleModel}.validation.${field.fieldName}Required")`;
    if (field.zodType === "string" || isIdField) {
      zodChain += `.min(1, { message: ${requiredTranslationKey} })`;
    }
    if (field.zodType === "date") {
      zodChain = `z.date({ required_error: ${requiredTranslationKey} })`;
    }
    if (field.zodType === "any") {
      zodChain += `.refine((file) => file, { message: ${requiredTranslationKey} })`;
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
  const isIdField =
    field.fieldName.toLowerCase().includes("id") ||
    field.fieldName.toLowerCase().endsWith("_id");

  if (field.fieldName.toLowerCase().includes("phone")) return '""';
  if (field.zodType === "boolean") return "false";
  if (field.zodType === "number" && !isIdField) return "0";
  if (field.zodType === "date") return "undefined";
  if (field.zodType === "any") return "null";
  if (isIdField) return '""';
  return '""';
}


function generateFormField(field: Field, modelName: string): string {
  const singleModel = modelName.toLowerCase();
  const isIdField = field.fieldName.toLowerCase().includes('id') || field.fieldName.toLowerCase().endsWith('_id');
  const displayKey = isIdField ? field.fieldName.replace(/_id$/, "") : field.fieldName;
  const commonLabel = `<FormLabel className="text-sm font-medium">{t("${singleModel}.fields.${displayKey}")}</FormLabel>`;
  let control: string;

    // --- PHONE SPECIAL CASE ---
    if (field.fieldName.toLowerCase().includes("phone")) {
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
        <FormItem>
          ${commonLabel}
          <FormControl>
            <PhoneInput
              international
              defaultCountry="US"
              value={field.value}
              onChange={field.onChange}
              className="bg-background h-12 w-full border rounded-md px-2"
            />
          </FormControl>
          <FormMessage className="text-red-400 font-normal text-sm" />
        </FormItem>
      )} />`;
    }  

  switch (field.uiType) {
    case "textarea":
      control = `<Textarea className="bg-background min-h-[80px]" placeholder={t("${singleModel}.placeholders.${displayKey}")} {...field} />`;
      break;

    case "select":
      const selectOptions = (field.options || ["Default 1", "Default 2"])
        .map((opt) => {
          // For ID fields (now treated as strings) or number fields, handle appropriately
          const optionValue = (field.zodType === "number" && !isIdField) ? String(opt) : opt;
          return `<SelectItem value="${optionValue}">${opt}</SelectItem>`;
        })
        .join("\n              ");

      // Update onChange logic for ID fields
      const onChangeLogic = (field.zodType === "number" && !isIdField)
        ? `(val) => field.onChange(Number(val))`
        : `field.onChange`;

      const valueLogic = (field.zodType === "number" && !isIdField)
        ? `String(field.value ?? '')`
        : `field.value ?? ''`;

      control = `<Select onValueChange={${onChangeLogic}} value={${valueLogic}}>
        <SelectTrigger className="w-full bg-background h-12">
          <SelectValue placeholder={t("${singleModel}.placeholders.${displayKey}")} />
        </SelectTrigger>
        <SelectContent>
          ${selectOptions}
        </SelectContent>
      </Select>`;
      break;

    case "checkbox":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
        <FormItem className="flex items-center gap-x-3 space-y-0 pt-6">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">${commonLabel}</div>
        </FormItem>
      )} />`;

    case "switch":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
        <FormItem className="items-center justify-between">
          <div className="space-y-0.5">${commonLabel}</div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )} />`;

    case "radio":
      const radioOptions = (field.options || ["Default A", "Default B"])
        .map((opt) => {
          const optionKey = opt.toLowerCase().replace(/\s+/g, "");
          const optionValue = opt.toLowerCase().replace(/\s+/g, "_");
          return `<FormItem className="flex items-center space-x-2">
              <FormControl><RadioGroupItem value="${optionValue}" /></FormControl>
              <FormLabel className="font-normal">{t("${singleModel}.options.${optionKey}") ?? "${opt}"}</FormLabel>
            </FormItem>`;
        })
        .join("\n              ");

      control = `<RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 pt-2">
        ${radioOptions}
      </RadioGroup>`;
      break;

    case "file":
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
          className={cn(
            "bg-background flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition hover:border-primary/50",
            is${capFieldName}DragActive ? "border-primary bg-muted" : "border-muted-foreground/25"
          )}
        >
          <input {...getInputPropsFor${capFieldName}()} />
          <CloudUpload className="text-muted-foreground mb-2" />
          {${field.fieldName}File ? (
            <div className="flex flex-col items-center text-center">
              {${field.fieldName}File.type.startsWith("image/") && 
                <img src={URL.createObjectURL(${field.fieldName}File)} alt="Preview" className="h-20 w-20 rounded-full object-cover" />
              }
              <p className="text-sm text-foreground">{${field.fieldName}File.name}</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">{t('common.dragAndDrop')}</p>
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage className="text-red-400 font-normal text-sm" />
    </FormItem>
  )}
/>`;

    case "color":
      control = `<Input type="color" className="bg-background h-12 w-full" {...field} />`;
      break;

    case "datepicker":
      return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
        <FormItem>
          ${commonLabel}
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button variant={"outline"} className={cn(
                  "w-full bg-background pl-3 text-left font-normal h-12",
                  !field.value && "text-muted-foreground"
                )}>
                  {field.value ? (format(field.value, "PPP")) : (<span>{t('common.pickADate')}</span>)}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
            </PopoverContent>
          </Popover>
        <FormMessage className="text-red-400 font-normal text-sm" />
        </FormItem>
      )} />`;

    default:
      let inputType = "text";
      if (field.fieldName.toLowerCase().includes("password")) inputType = "password";
      else if (field.validationRules.some((r) => r.type === "email")) inputType = "email";
      else if (field.validationRules.some((r) => r.type === "url")) inputType = "url";
      else if (field.zodType === "number" && !isIdField) inputType = "number";
      // ID fields will use text input instead of number input

      if (field.fieldName.toLowerCase().includes("password")) {
        control = `<div className="relative">
          <Input type={showPassword ? "text" : "password"} className="bg-background pr-10 h-12" placeholder={t("${singleModel}.placeholders.${displayKey}")} {...field} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>`;
      } else {
        control = `<Input type="${inputType}" className="bg-background h-12" placeholder={t("${singleModel}.placeholders.${displayKey}")} {...field} />`;
      }
  }

  return `<FormField control={form.control} name="${field.fieldName}" render={({ field }) => (
    <FormItem>
      ${commonLabel}
      <FormControl>
        ${control}
      </FormControl>
     <FormMessage className="text-red-400 font-normal text-sm" />
    </FormItem>
  )} />`;
}

function generateOnSubmitFunction(modelName: string, fileFields: Field[]): string {
  const typeName = `${capitalize(modelName)}FormValues`;
  
  // Logic for forms WITHOUT file uploads (e.g., Role, Brand)
  if (fileFields.length === 0) {
    return `  function handleFormSubmit(values: ${typeName}) {
    onSubmit(values);
  }`;
  }

  // Logic for forms WITH file uploads (e.g., User)
  const formDataLogic = fileFields.map(field => `
    if (${field.fieldName}File) {
      formData.append("${field.fieldName}", ${field.fieldName}File);
    } else if (values.${field.fieldName}) {
      formData.append("${field.fieldName}", values.${field.fieldName});
    }`).join('');

  return `  function handleFormSubmit(values: ${typeName}) {
    const formData = new FormData();
    for (const key in values) {
      const value = values[key as keyof typeof values];
      if (${fileFields.map(f => `key === '${f.fieldName}'`).join(' || ')}) continue;
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }${formDataLogic}

    onSubmit(formData);
  }`;
}

// --- MAIN GENERATOR FUNCTION ---

export function generateFormComponent(modelName: string, modelConfig: ModelConfig): void {
  const modelDirName = capitalize(modelName);
  const componentName = `${capitalize(modelName)}Form`;
  const outputDir = path.join(getBaseDir(), "src", "components", "forms", modelDirName);

  const hasDatePicker = modelConfig.fields.some((f) => f.uiType === "datepicker");
  const hasFileUpload = modelConfig.fields.some((f) => f.uiType === "file");
  const hasPassword = modelConfig.fields.some(f => f.fieldName.toLowerCase().includes("password"));

  const zodSchemaFields = modelConfig.fields.map((f) => `    ${f.fieldName}: ${generateZodValidation(f, modelName)}`).join(",\n");
  const defaultValues = modelConfig.fields.map((f) => `      ${f.fieldName}: ${generateDefaultValue(f)}`).join(",\n");

  // Generate different form components based on isPopup flag
  const componentContent = modelConfig.isPopup 
    ? generateDrawerFormComponent(modelName, componentName, zodSchemaFields, defaultValues, modelConfig.fields, hasDatePicker, hasFileUpload, hasPassword)
    : generatePageFormComponent(modelName, componentName, zodSchemaFields, defaultValues, modelConfig.fields, hasDatePicker, hasFileUpload, hasPassword);

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, `${componentName}.tsx`), componentContent, "utf8");
  
  const formType = modelConfig.isPopup ? "Drawer Form" : "Page Form";
  console.log(`✅ Generated ${formType} for ${modelName} at: ${path.join(outputDir, `${componentName}.tsx`)}`);
}

// --- DRAWER FORM COMPONENT GENERATOR ---

function generateDrawerFormComponent(modelName: string, componentName: string, zodSchema: string, defaultValues: string, fields: Field[], hasDatePicker: boolean, hasFileUpload: boolean, hasPassword: boolean): string {
  const typeName = `${capitalize(modelName)}FormValues`;
  const singleModel = modelName.toLowerCase();
  const fileFields = fields.filter(f => f.uiType === 'file');

  const mainFormFields = fields.map(field => {
    const fieldJsx = generateFormField(field, modelName);
    if (field.isRemoveInEditForm) {
      return `          {!initialData?.id && (\n            <>${fieldJsx}</>\n          )}`;
    }
    return `          ${fieldJsx}`;
  }).join("\n\n");

  const lucideIcons = [];
  if (hasFileUpload) lucideIcons.push('CloudUpload');
  if (hasDatePicker) lucideIcons.push('CalendarIcon');
  if (hasPassword) {
      lucideIcons.push('Eye');
      lucideIcons.push('EyeOff');
  }

  const imports = [
    `import { useForm } from "react-hook-form";`,
    `import { zodResolver } from "@hookform/resolvers/zod";`,
    `import * as z from "zod";`,
    `import { useTranslation } from "react-i18next";`,
    (hasFileUpload || hasPassword) && `import { useState } from "react";`,
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
    `import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";`,
    `import "react-phone-number-input/style.css";`,
  ].filter(Boolean).join('\n');

  const stateHooks = fileFields.map(f => `  const [${f.fieldName}File, set${capitalize(f.fieldName)}File] = useState<File | null>(null);`).join('\n');
  const passwordStateHook = hasPassword ? `  const [showPassword, setShowPassword] = useState(false);` : "";
  const dropzoneHooks = fileFields.map(f => `
  const { getRootProps: getRootPropsFor${capitalize(f.fieldName)}, getInputProps: getInputPropsFor${capitalize(f.fieldName)}, isDragActive: is${capitalize(f.fieldName)}DragActive } = useDropzone({
    accept: { "image/*": [] },
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

// Schema with translated error messages
const ${capitalize(modelName)}Schema = (t: any) =>
  z.object({
${zodSchema}
  });

type ${typeName} = z.infer<ReturnType<typeof ${capitalize(modelName)}Schema>>;

interface ${componentName}Props {
  initialData?: Partial<${typeName}> & { id?: any };
  onSubmit: (values: ${typeName} | FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ${componentName}({ initialData, onSubmit, onCancel, isLoading = false }: ${componentName}Props) {
  const { t } = useTranslation();
${stateHooks}
${passwordStateHook}

  const form = useForm<${typeName}>({
    resolver: zodResolver(${capitalize(modelName)}Schema(t)),
    defaultValues: {
${defaultValues},
      ...initialData,
    },
  });
${dropzoneHooks}

  ${generateOnSubmitFunction(modelName, fileFields)}

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
${mainFormFields}
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}`;
}

// --- PAGE FORM COMPONENT GENERATOR ---

function generatePageFormComponent(modelName: string, componentName: string, zodSchema: string, defaultValues: string, fields: Field[], hasDatePicker: boolean, hasFileUpload: boolean, hasPassword: boolean): string {
  const typeName = `${capitalize(modelName)}FormValues`;
  const singleModel = modelName.toLowerCase();
  const fileFields = fields.filter(f => f.uiType === 'file');

  const mainFormFields = fields.map(field => {
    const fieldJsx = generateFormField(field, modelName);
    if (field.isRemoveInEditForm) {
      return `          {!initialData?.id && (\n            <>${fieldJsx}</>\n          )}`;
    }
    return `          ${fieldJsx}`;
  }).join("\n\n");

  const lucideIcons = [];
  if (hasFileUpload) lucideIcons.push('CloudUpload');
  if (hasDatePicker) lucideIcons.push('CalendarIcon');
  if (hasPassword) {
      lucideIcons.push('Eye');
      lucideIcons.push('EyeOff');
  }

  const imports = [
    `import { useForm } from "react-hook-form";`,
    `import { zodResolver } from "@hookform/resolvers/zod";`,
    `import * as z from "zod";`,
    `import { useTranslation } from "react-i18next";`,
    (hasFileUpload || hasPassword) && `import { useState } from "react";`,
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
    `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";`,
    `import { Separator } from "@/components/ui/separator";`,
    `import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";`,
    `import "react-phone-number-input/style.css";`,
  ].filter(Boolean).join('\n');

  const stateHooks = fileFields.map(f => `  const [${f.fieldName}File, set${capitalize(f.fieldName)}File] = useState<File | null>(null);`).join('\n');
  const passwordStateHook = hasPassword ? `  const [showPassword, setShowPassword] = useState(false);` : "";
  const dropzoneHooks = fileFields.map(f => `
  const { getRootProps: getRootPropsFor${capitalize(f.fieldName)}, getInputProps: getInputPropsFor${capitalize(f.fieldName)}, isDragActive: is${capitalize(f.fieldName)}DragActive } = useDropzone({
    accept: { "image/*": [] },
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

// Schema with translated error messages
const ${capitalize(modelName)}Schema = (t: any) =>
  z.object({
${zodSchema}
  });

type ${typeName} = z.infer<ReturnType<typeof ${capitalize(modelName)}Schema>>;

interface ${componentName}Props {
  initialData?: Partial<${typeName}> & { id?: any };
  onSubmit: (values: ${typeName} | FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function ${componentName}({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  title,
  description 
}: ${componentName}Props) {
  const { t } = useTranslation();
${stateHooks}
${passwordStateHook}

  const form = useForm<${typeName}>({
    resolver: zodResolver(${capitalize(modelName)}Schema(t)),
    defaultValues: {
${defaultValues},
      ...initialData,
    },
  });
${dropzoneHooks}

  ${generateOnSubmitFunction(modelName, fileFields)}

  return (
    <div className="container mx-auto py-6 max-w-8xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {title || (initialData?.id ? t('${singleModel}.edit.title') : t('${singleModel}.create.title'))}
          </CardTitle>
          
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
${mainFormFields}
              </div>
              
          
              
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel} 
                  disabled={isLoading}
                  className="sm:w-auto"
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="sm:w-auto"
                >
                  {isLoading ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}`;}