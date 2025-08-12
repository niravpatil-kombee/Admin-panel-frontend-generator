// src/utils/excelParser.ts

import xlsx from "xlsx";
import fs from "fs";

/**
 * Defines the structure of a single form field, parsed from your specific Excel sheet.
 */
export interface Field {
  fieldName: string; // from 'column'
  label: string;
  dataType: string; // from 'type' (e.g., int, varchar)
  zodType: 'string' | 'number' | 'boolean' | 'date' | 'any'; // Our mapping for Zod
  uiType: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'color'; // Our mapping for Shadcn
  required: boolean; // from 'is_null' === 'N'
  options?: string[]; // from 'comments' like "Y => Active, N => Inactive"
  placeholder?: string;
  description?: string; // from 'comments'
}

/**
 * Creates a human-readable label from a snake_case or camelCase field name.
 */
function createLabel(fieldName: string): string {
  if (!fieldName) return '';
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parses the 'comments' column to extract options for select or radio inputs.
 */
function parseOptionsFromComments(comment: string): string[] | undefined {
  if (!comment || !comment.includes('=>')) return undefined;
  const optionRegex = /=>\s*['"]?([^,'"]+)['"]?/g;
  const options: string[] = [];
  let match;
  while ((match = optionRegex.exec(comment)) !== null) {
    options.push(match[1].trim());
  }
  return options.length > 0 ? options : undefined;
}

/**
 * Main Excel parser with support for skipping metadata rows and not requiring `is_input_form`.
 */
export function parseExcel(filePath: string): Record<string, Field[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  const workbook = xlsx.readFile(filePath);
  const models: Record<string, Field[]> = {};

  console.log("Starting Excel parsing...");
  console.log("Sheets found:", workbook.SheetNames.join(", "));

  for (const sheetName of workbook.SheetNames) {
    const modelName = sheetName.trim();
    if (!modelName) continue;

    console.log(`\n--- Processing sheet: "${modelName}" ---`);
    const worksheet = workbook.Sheets[sheetName];

    // ✅ Skip first metadata row, read from row index 1 (second row in Excel)
    const rawRows = xlsx.utils.sheet_to_json<any>(worksheet, { range: 1 });

    if (!rawRows || rawRows.length === 0) {
      console.warn(`Sheet "${modelName}" is empty or could not be read. Skipping.`);
      continue;
    }

    // Diagnostic log
    console.log("Inspecting keys from the first row object:", Object.keys(rawRows[0]));

    const fields: Field[] = rawRows
      .filter(row => {
        // ✅ Only require that a 'column' value exists
        return row.column && String(row.column).trim() !== '';
      })
      .map((row: any): Field => {
        const fieldName = String(row.column).trim();
        const comments = String(row.comments || '');
        const uiComponent = String(row.ui_component || 'text').toLowerCase();

        let zodType: Field['zodType'] = 'string';
        const dbType = String(row.type || '').toLowerCase();
        if (dbType.includes('int') || dbType === 'decimal' || dbType === 'double') {
          zodType = 'number';
        } else if (uiComponent === 'switch') {
          zodType = 'boolean';
        } else if (dbType === 'date' || dbType === 'datetime') {
          zodType = 'date';
        } else if (uiComponent === 'file_upload') {
          zodType = 'any';
        }

        let uiType: Field['uiType'] = 'input';
        switch (uiComponent) {
          case 'dropdown': uiType = 'select'; break;
          case 'radio': uiType = 'radio'; break;
          case 'switch': uiType = 'checkbox'; break;
          case 'file_upload': uiType = 'file'; break;
          case 'tinymce': uiType = 'textarea'; break;
          case 'color_picker': uiType = 'color'; break;
          default: uiType = 'input';
        }

        const options = parseOptionsFromComments(comments);

        return {
          fieldName,
          label: createLabel(fieldName),
          dataType: dbType,
          zodType,
          uiType,
          required: row.is_null && String(row.is_null).trim().toUpperCase() === 'N',
          options,
          description: !options ? comments : undefined,
          placeholder: `Enter ${createLabel(fieldName)}...`,
        };
      });

    if (fields.length > 0) {
      console.log(`✅ Successfully parsed ${fields.length} fields for model "${modelName}".`);
      models[modelName] = fields;
    } else {
      console.warn(`⚠️ No valid 'column' values found in sheet "${modelName}". No form will be generated for this model.`);
    }
  }
  return models;
}
