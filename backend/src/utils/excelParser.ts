// src/utils/excelParser.ts
import xlsx from "xlsx";
import fs from "fs";

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
}

function createLabel(fieldName: string): string {
  if (!fieldName) return "";
  return fieldName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// NEW: Helper function to parse key-value options from the comments column
function parseOptionsFromComments(comment: string): string[] | undefined {
  if (!comment || !comment.includes('=>')) return undefined;
  // This regex finds the text after "=>" and before the next comma or end of string
  const optionRegex = /=>\s*([^,]+)/g;
  const options: string[] = [];
  let match;
  while ((match = optionRegex.exec(comment)) !== null) {
    options.push(match[1].trim());
  }
  return options.length > 0 ? options : undefined;
}

export function parseExcel(filePath: string): Record<string, Field[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  const workbook = xlsx.readFile(filePath);
  const models: Record<string, Field[]> = {};

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    // ✅ Get table name from cell B1
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
        } else if (dbType === "date" || dbType === "datetime" || uiComponent === "datepicker") {
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
          case "datepicker": uiType = "datepicker"; break;
          default: uiType = "input";
        }

        return {
          fieldName,
          label: createLabel(fieldName),
          dataType: dbType,
          zodType,
          uiType,
          required: row.is_null && String(row.is_null).trim().toUpperCase() === "N",
          options: parseOptionsFromComments(String(row.comments || "")),
          placeholder: `Enter ${createLabel(fieldName)}...`,
        };
      })
      .filter((f): f is Field => f !== null);

    if (fields.length > 0) {
      models[tableName] = fields; 
    }
  }
  return models;
}
