// src/utils/excelParser.ts
import xlsx from "xlsx";
import fs from "fs";

// --- Interfaces and helper functions are unchanged ---
export interface ValidationRule {
  type:
    | "required"
    | "min"
    | "max"
    | "minLength"
    | "maxLength"
    | "email"
    | "url"
    | "regex"
    | "custom";
  value?: number | string | RegExp;
  message?: string;
}
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
  validationRules: ValidationRule[];
}
export interface ModelConfig {
  fields: Field[];
  noCrud: boolean;
  isPopup: boolean;
}
function createLabel(fieldName: string): string {
  if (!fieldName) return "";
  let label = fieldName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  if (fieldName.toLowerCase().endsWith("_id")) {
    label = label.replace(/\s+Id$/, "");
  }
  return label;
}
function parseOptionsFromComments(comment: string): string[] | undefined {
  if (!comment || !comment.includes("=>")) return undefined;
  const optionRegex = /=>\s*([^,]+)/g;
  const options: string[] = [];
  let match;
  while ((match = optionRegex.exec(comment)) !== null) {
    options.push(match[1].trim());
  }
  return options.length > 0 ? options : undefined;
}
function parseValidationRules(
  validationString: string,
  fieldName: string
): ValidationRule[] {
  if (!validationString || validationString.trim() === "") return [];
  const rules: ValidationRule[] = [];
  const validationStr = validationString.toLowerCase().trim();
  const patterns = [
    {
      regex: /required/i,
      handler: () =>
        rules.push({
          type: "required" as const,
          message: `${createLabel(fieldName)} is required`,
        }),
    },
    {
      regex: /min.*?(\d+)/i,
      handler: (match: RegExpMatchArray) =>
        rules.push({
          type: "minLength" as const,
          value: parseInt(match[1]),
          message: `${createLabel(fieldName)} must be at least ${
            match[1]
          } characters`,
        }),
    },
    {
      regex: /max.*?(\d+)/i,
      handler: (match: RegExpMatchArray) =>
        rules.push({
          type: "maxLength" as const,
          value: parseInt(match[1]),
          message: `${createLabel(fieldName)} must not exceed ${
            match[1]
          } characters`,
        }),
    },
    {
      regex: /email/i,
      handler: () =>
        rules.push({
          type: "email" as const,
          message: `Please enter a valid email address`,
        }),
    },
    {
      regex: /url/i,
      handler: () =>
        rules.push({
          type: "url" as const,
          message: `Please enter a valid URL`,
        }),
    },
    {
      regex: /(?:min|minimum).*?(\d+(?:\.\d+)?)/i,
      handler: (match: RegExpMatchArray) =>
        rules.push({
          type: "min" as const,
          value: parseFloat(match[1]),
          message: `${createLabel(fieldName)} must be at least ${match[1]}`,
        }),
    },
    {
      regex: /(?:max|maximum).*?(\d+(?:\.\d+)?)/i,
      handler: (match: RegExpMatchArray) =>
        rules.push({
          type: "max" as const,
          value: parseFloat(match[1]),
          message: `${createLabel(fieldName)} must not exceed ${match[1]}`,
        }),
    },
    {
      regex: /regex:\s*\/(.+?)\//i,
      handler: (match: RegExpMatchArray) =>
        rules.push({
          type: "regex" as const,
          value: new RegExp(match[1]),
          message: `${createLabel(fieldName)} format is invalid`,
        }),
    },
  ];
  patterns.forEach((pattern) => {
    const match = validationStr.match(pattern.regex);
    if (match) {
      pattern.handler(match);
    }
  });
  if (validationStr.includes("unique")) {
    rules.push({
      type: "custom" as const,
      value: "unique",
      message: `${createLabel(fieldName)} must be unique`,
    });
  }
  if (validationStr.includes("format")) {
    rules.push({
      type: "custom" as const,
      value: "format",
      message: `${createLabel(fieldName)} format is invalid`,
    });
  }
  return rules;
}

/**
 * Scans the header region (first two rows) of a sheet to find configuration flags.
 * This is robust and handles flags being in either row 1 or row 2.
 * @param worksheet The Excel worksheet object.
 * @returns An object containing the detected configuration flags.
 */
function getTableConfig(worksheet: xlsx.WorkSheet): {
  isPopup: boolean;
  noCrud: boolean;
} {
  const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1");
  let isPopup = false;
  let noCrud = false;

  // Scan the first two rows (index 0 and 1) across all columns
  for (let r = 0; r <= 1; r++) {
    // Stop if we've already found both flags
    if (isPopup && noCrud) break;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = xlsx.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];

      if (cell && cell.v) {
        const cellValue = String(cell.v).trim().toLowerCase();

        if (cellValue === "is_popup") {
          isPopup = true;
        } else if (cellValue === "no_crud") {
          noCrud = true;
        }
      }
    }
  }

  return { isPopup, noCrud };
}

// MAIN PARSING FUNCTION
export function parseExcel(filePath: string): Record<string, ModelConfig> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  const workbook = xlsx.readFile(filePath);
  const models: Record<string, ModelConfig> = {};

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const tableNameCell = worksheet["B1"];
    const tableName = tableNameCell
      ? String(tableNameCell.v).trim()
      : sheetName;

    if (!tableName) continue;

    // Get table-level configuration by scanning the first two rows.
    const { isPopup, noCrud } = getTableConfig(worksheet);

    if (noCrud) {
      console.log(`⏩ Skipping ${tableName} (found 'no_crud' flag).`);
      continue;
    }

    console.log(
      `✅ SUCCESS: Configuring ${tableName} to use ${
        isPopup ? "DRAWER" : "PAGE"
      } forms.`
    );

    // Convert sheet to JSON, using the second row (range: 1) as the headers for the data.
    const rawRows = xlsx.utils.sheet_to_json<any>(worksheet, { range: 1 });

    if (!rawRows || rawRows.length === 0) continue;

    const fields: Field[] = rawRows
      .filter((row) => row.column && String(row.column).trim() !== "")
      .map((row: any): Field | null => {
        const fieldName = String(row.column).trim();
        const uiComponent = String(row.ui_component || "").toLowerCase();

        // **FIX:** The check for a ui_component is reinstated. If the cell is empty,
        // the field will be ignored and not included in the form. This correctly
        // excludes the 'id' field.
        if (!uiComponent) return null;

        let zodType: Field["zodType"] = "string";
        const dbType = String(row.type || "").toLowerCase();

        if (
          dbType.includes("int") ||
          dbType === "decimal" ||
          dbType === "double"
        ) {
          zodType = "number";
        } else if (uiComponent === "switch" || uiComponent === "checkbox") {
          zodType = "boolean";
        } else if (
          dbType.includes("date") ||
          uiComponent === "datepicker" ||
          uiComponent === "date_picker"
        ) {
          zodType = "date";
        } else if (uiComponent === "file_upload") {
          zodType = "any";
        }

        let uiType: Field["uiType"] = "input";
        switch (uiComponent) {
          case "dropdown":
            uiType = "select";
            break;
          case "radio":
            uiType = "radio";
            break;
          case "checkbox":
            uiType = "checkbox";
            break;
          case "switch":
            uiType = "switch";
            break;
          case "file_upload":
            uiType = "file";
            break;
          case "tinymce":
          case "textarea":
            uiType = "textarea";
            break;
          case "color_picker":
            uiType = "color";
            break;
          case "datepicker":
          case "date_picker":
            uiType = "datepicker";
            break;
          default:
            uiType = "input";
        }

        const validationRules = parseValidationRules(
          String(row.validation_rule || ""),
          fieldName
        );
        return {
          fieldName,
          label: createLabel(fieldName),
          dataType: dbType,
          zodType,
          uiType,
          required:
            String(row.is_null || "")
              .trim()
              .toUpperCase() === "N",
          options: parseOptionsFromComments(String(row.comments || "")),
          placeholder: `Enter ${createLabel(fieldName)}...`,
          sortable:
            String(row.sortable || "")
              .trim()
              .toUpperCase() === "Y",
          hidden:
            String(row.hidden || "")
              .trim()
              .toUpperCase() === "Y",
          isInListing:
            String(row.is_in_listing || "")
              .trim()
              .toUpperCase() === "Y",
          isRemoveInEditForm:
            String(row.is_remove_in_edit_form || "")
              .trim()
              .toUpperCase() === "Y",
          validationRules,
        };
      })
      .filter((f): f is Field => f !== null);

    if (fields.length > 0) {
      models[tableName] = { fields, noCrud, isPopup };
    }
  }
  return models;
}