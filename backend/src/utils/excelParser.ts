// src/utils/excelParser.ts
import xlsx from "xlsx";
import fs from "fs";

// UPDATED: Added validation rules to the Field interface
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'email' | 'url' | 'regex' | 'custom';
  value?: number | string | RegExp;
  message?: string;
}

// UPDATED: The Field interface now includes the new metadata flags.
export interface Field {
  fieldName: string;
  label: string;
  dataType: string;
  zodType: "string" | "number" | "boolean" | "date" | "any";
  uiType:
    | "input"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "file"
    | "color"
    | "datepicker"
    | "switch";
  required: boolean;
  options?: string[];
  placeholder?: string;
  sortable: boolean;
  hidden: boolean;
  isInListing: boolean;
  isRemoveInEditForm: boolean;
  validationRules : ValidationRule[];
}

// UPDATED: This function now intelligently removes " Id" from field names ending in "_id".
function createLabel(fieldName: string): string {
  if (!fieldName) return "";
  
  let label = fieldName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // If the original field name ends with '_id', remove the trailing ' Id' from the label.
  if (fieldName.toLowerCase().endsWith('_id')) {
    label = label.replace(/\s+Id$/, '');
  }

  return label;
}

function parseOptionsFromComments(comment: string): string[] | undefined {
  if (!comment || !comment.includes('=>')) return undefined;
  const optionRegex = /=>\s*([^,]+)/g;
  const options: string[] = [];
  let match;
  while ((match = optionRegex.exec(comment)) !== null) {
    options.push(match[1].trim());
  }
  return options.length > 0 ? options : undefined;
}

// NEW: Function to parse validation rules from the validation_rule column
function parseValidationRules(validationString: string, fieldName: string): ValidationRule[] {
  if (!validationString || validationString.trim() === '') return [];
  
  const rules: ValidationRule[] = [];
  const validationStr = validationString.toLowerCase().trim();
  
  // Parse different validation patterns
  const patterns = [
    // Required validation
    {
      regex: /required/i,
      handler: () => rules.push({ 
        type: 'required' as const, 
        message: `${createLabel(fieldName)} is required` 
      })
    },
    // Min/Max length for strings
    {
      regex: /min.*?(\d+)/i,
      handler: (match: RegExpMatchArray) => rules.push({ 
        type: 'minLength' as const, 
        value: parseInt(match[1]),
        message: `${createLabel(fieldName)} must be at least ${match[1]} characters`
      })
    },
    {
      regex: /max.*?(\d+)/i,
      handler: (match: RegExpMatchArray) => rules.push({ 
        type: 'maxLength' as const, 
        value: parseInt(match[1]),
        message: `${createLabel(fieldName)} must not exceed ${match[1]} characters`
      })
    },
    // Email validation
    {
      regex: /email/i,
      handler: () => rules.push({ 
        type: 'email' as const, 
        message: `Please enter a valid email address`
      })
    },
    // URL validation
    {
      regex: /url/i,
      handler: () => rules.push({ 
        type: 'url' as const, 
        message: `Please enter a valid URL`
      })
    },
    // Numeric min/max
    {
      regex: /(?:min|minimum).*?(\d+(?:\.\d+)?)/i,
      handler: (match: RegExpMatchArray) => rules.push({ 
        type: 'min' as const, 
        value: parseFloat(match[1]),
        message: `${createLabel(fieldName)} must be at least ${match[1]}`
      })
    },
    {
      regex: /(?:max|maximum).*?(\d+(?:\.\d+)?)/i,
      handler: (match: RegExpMatchArray) => rules.push({ 
        type: 'max' as const, 
        value: parseFloat(match[1]),
        message: `${createLabel(fieldName)} must not exceed ${match[1]}`
      })
    },
    // Custom regex patterns (looking for patterns like "regex:/pattern/")
    {
      regex: /regex:\s*\/(.+?)\//i,
      handler: (match: RegExpMatchArray) => rules.push({ 
        type: 'regex' as const, 
        value: new RegExp(match[1]),
        message: `${createLabel(fieldName)} format is invalid`
      })
    }
  ];

  // Apply all matching patterns
  patterns.forEach(pattern => {
    const match = validationStr.match(pattern.regex);
    if (match) {
      pattern.handler(match);
    }
  });

  // Handle specific validation strings from your Excel
  if (validationStr.includes('unique')) {
    rules.push({ 
      type: 'custom' as const, 
      value: 'unique',
      message: `${createLabel(fieldName)} must be unique`
    });
  }

  if (validationStr.includes('format')) {
    rules.push({ 
      type: 'custom' as const, 
      value: 'format',
      message: `${createLabel(fieldName)} format is invalid`
    });
  }

  return rules;
}

export function parseExcel(filePath: string): Record<string, Field[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  const workbook = xlsx.readFile(filePath);
  const models: Record<string, Field[]> = {};

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    const tableNameCell = worksheet["B1"];
    const tableName = tableNameCell ? String(tableNameCell.v).trim() : sheetName;

    if (!tableName) continue;

    const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1");

    let hasNoCrudColumn = false;
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = xlsx.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v && String(cell.v).trim().toLowerCase() === "no_crud") {
        hasNoCrudColumn = true;
        break;
      }
    }

    if (hasNoCrudColumn) {
      console.log(`⏩ Skipping ${tableName} (found no_crud column)`);
      continue;
    }

    const rawRows = xlsx.utils.sheet_to_json<any>(worksheet, { range: 1 });

    if (!rawRows || rawRows.length === 0) continue;

    const fields: Field[] = rawRows
      .filter((row) => row.column && String(row.column).trim() !== "")
      .map((row: any): Field | null => {
        const fieldName = String(row.column).trim();
        const uiComponent = String(row.ui_component || "").toLowerCase();

        if (!uiComponent) return null;

        let zodType: Field["zodType"] = "string";
        const dbType = String(row.type || "").toLowerCase();

        if (dbType.includes("int") || dbType === "decimal" || dbType === "double") {
          zodType = "number";
        } else if (uiComponent === "switch" || uiComponent === "checkbox") {
          zodType = "boolean";
        } else if (dbType.includes("date") || uiComponent === "datepicker" || uiComponent === "date_picker") {
          zodType = "date";
        } else if (uiComponent === "file_upload") {
          zodType = "any";
        }

        let uiType: Field["uiType"] = "input";
        switch (uiComponent) {
          case "dropdown": uiType = "select"; break;
          case "radio": uiType = "radio"; break;
          case "checkbox": uiType = "checkbox"; break;
          case "switch": uiType = "switch"; break;
          case "file_upload": uiType = "file"; break;
          case "tinymce":
          case "textarea": uiType = "textarea"; break;
          case "color_picker": uiType = "color"; break;
          case "datepicker":
            case "date_picker":
              uiType = "datepicker";
              break;
          default: uiType = "input";
        }

        // NEW: Parse validation rules from the validation_rule column
        const validationRules = parseValidationRules(
          String(row.validation_rule || ""), 
          fieldName
        );

        // UPDATED: Parsing logic for the new metadata columns is added here.
        // It converts a 'Y' from the Excel sheet into a true boolean value.
        return {
          fieldName,
          label: createLabel(fieldName),
          dataType: dbType,
          zodType,
          uiType,
          required: String(row.is_null || "").trim().toUpperCase() === "N",
          options: parseOptionsFromComments(String(row.comments || "")),
          placeholder: `Enter ${createLabel(fieldName)}...`,
          sortable: String(row.sortable || "").trim().toUpperCase() === "Y",
          hidden: String(row.hidden || "").trim().toUpperCase() === "Y",
          isInListing: String(row.is_in_listing || "").trim().toUpperCase() === "Y",
          isRemoveInEditForm: String(row.is_remove_in_edit_form || "").trim().toUpperCase() === "Y",
          validationRules,
        };
      })
      .filter((f): f is Field => f !== null);

    if (fields.length > 0) {
      models[tableName] = fields; 
    }
  }
  return models;
}