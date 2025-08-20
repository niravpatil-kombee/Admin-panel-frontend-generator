// src/utils/generators/formGenerator.ts
import fs from "fs";
import path from "path";
import { Field } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function generateFormField(field: Field): string {
  const commonLabel = `<FormLabel>${field.label}</FormLabel>`;
  let control: string;

  switch (field.uiType) {
    case "textarea":
      control = `<Textarea placeholder="${field.placeholder}" {...field} />`;
      break;

    case "select":
      const selectOptions = (field.options || ["Option 1", "Option 2"])
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
      const radioOptions = (field.options || ["Option A", "Option B"])
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
      control = `<Input type="file" {...field} />`;
      break;

    case "color":
      control = `<Input type="color" {...field} />`;
      break;

    // UPDATED: This now generates the correct Shadcn UI date picker with a calendar pop-up.
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
      control = `<Input placeholder="${field.placeholder}" {...field} />`;
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

  const mainFormFields = fields.map(generateFormField).join("\n\n                    ");

  // UPDATED: Added all necessary imports for the date picker component.
  const componentContent = `
import { useForm } from "react-hook-form";
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