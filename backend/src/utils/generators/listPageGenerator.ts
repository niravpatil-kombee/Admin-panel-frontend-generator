import fs from "fs";
import path from "path";
import { Field, ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const sanitizeFieldName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9_]/g, "_");
function mapToTsType(zodType: Field["zodType"]): string {
  switch (zodType) {
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "string";
    case "any":
      return "any";
    default:
      return "string";
  }
}

export function generateListPage(
  modelName: string,
  modelConfig: ModelConfig
): void {
  const { fields, isPopup } = modelConfig;
  const componentName = `${capitalize(modelName)}DataTable`;
  const formComponentName = `${capitalize(modelName)}Form`;
  const modelTypeName = capitalize(modelName);
  const singleModel = modelName.toLowerCase();

  const fieldsForListing = fields.filter((f) => f.isInListing);
  const fieldsForDialog = fields.filter((f) => !f.hidden);

  const modelDirName = capitalize(modelName);
  const outputDir = path.join(getBaseDir(), "src", "pages", modelDirName);

  const modelTypeDefinition = `\nexport type ${modelTypeName} = {\n  id: number | string;\n  ${fields
    .map(
      (field) =>
        `${sanitizeFieldName(field.fieldName)}: ${mapToTsType(field.zodType)};`
    )
    .join("\n  ")}\n};`;
  const mockData = `\nconst mockData: ${modelTypeName}[] = [\n  ${Array.from(
    { length: 13 },
    (_, i) =>
      `{ id: ${i + 1}, ${fields
        .map((f) => {
          const sName = sanitizeFieldName(f.fieldName);
          if (sName === "id") return ``;
          return `${sName}: ${
            mapToTsType(f.zodType) === "number"
              ? 10 + i
              : `"${capitalize(f.fieldName.replace(/_/g, " "))} ${i + 1}"`
          }`;
        })
        .join(", ")} }`
  ).join(",\n  ")}\n];`;

  const formImport = isPopup
    ? `import { ${formComponentName} } from "@/components/forms/${formComponentName}";`
    : `// Using full page form, no separate import needed if it's in the same directory structure.`;

  const componentContent = `
import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus, Eye, Pencil, Trash2, Upload, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
${isPopup ? `import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"` : ""}
${formImport}

${modelTypeDefinition}
${mockData}

export function ${componentName}() {
  const { t } = useTranslation();
  const [data, setData] = React.useState<${modelTypeName}[]>(mockData);
  const [sorting, setSorting] = React.useState<any[]>([]);
  const [columnFilters, setColumnFilters] = React.useState<any[]>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [viewingRow, setViewingRow] = React.useState<${modelTypeName} | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  ${
    isPopup
      ? `
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<${modelTypeName} | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleCreate = () => {
    setEditingRow(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (row: ${modelTypeName}) => {
    setEditingRow(row);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = (values: any) => {
    console.log("Form submitted from drawer:", values);
    // TODO: Add logic to either create or update the data
    setIsDrawerOpen(false); // Close drawer on submit
  };
  `
      : ""
  }

  const handleDeleteRow = (id: any) => { setItemToDelete(id); setIsAlertOpen(true); };
  const handleDeleteSelected = () => { const ids = table.getFilteredSelectedRowModel().rows.map(r => r.original.id); setItemToDelete(ids); setIsAlertOpen(true); };
  const confirmDelete = () => { if (!itemToDelete) return; if (Array.isArray(itemToDelete)) { const idSet = new Set(itemToDelete); setData(d => d.filter(item => !idSet.has(item.id))); table.resetRowSelection(); } else { setData(d => d.filter(item => item.id !== itemToDelete)); } setIsAlertOpen(false); setItemToDelete(null); };

  const columns: ColumnDef<${modelTypeName}>[] = React.useMemo(() => [
    { id: "select", header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)} />, cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={v => row.toggleSelected(!!v)} />, enableSorting: false },
    ${fieldsForListing
      .map(
        (field) => `{ 
      accessorKey: "${sanitizeFieldName(field.fieldName)}", 
      header: ({ column }) => (${
        field.sortable
          ? `<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>${field.label}<ArrowUpDown className="ml-2 h-4 w-4" /></Button>`
          : `<span>${field.label}</span>`
      })
    }`
      )
      .join(",\n    ")},
    { id: "actions", header: () => <div className="text-right">{t('common.actions')}</div>, cell: ({ row }) => (<div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" title={t('common.view')} onClick={() => setViewingRow(row.original)}><Eye className="h-4 w-4" /></Button>
      ${
        isPopup
          ? `<Button variant="ghost" size="icon" title={t('common.edit')} onClick={() => handleEdit(row.original)}><Pencil className="h-4 w-4" /></Button>`
          : `<Button asChild variant="ghost" size="icon" title={t('common.edit')}><Link to={\`/${singleModel}/edit/\${row.original.id}\`}><Pencil className="h-4 w-4" /></Link></Button>`
      }
      <Button variant="ghost" size="icon" title={t('common.delete')} className="text-red-600" onClick={() => handleDeleteRow(row.original.id)}><Trash2 className="h-4 w-4" /></Button>
    </div>) },
  ], [t]);

  const table = useReactTable({ data, columns, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, onRowSelectionChange: setRowSelection, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), state: { sorting, columnFilters, rowSelection } });

  return (
    <>
      <div className="w-full rounded-xl border bg-card shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <h1 className="text-2xl font-bold">{t('table.manageTitle', { model: t('models.${singleModel}_plural') })}</h1>
          <div className="flex items-center gap-2">
            {table.getFilteredSelectedRowModel().rows.length > 0 && (<Button variant="destructive" size="sm" onClick={handleDeleteSelected}>{t('table.deleteSelected', { count: table.getFilteredSelectedRowModel().rows.length })}</Button>)}
            <Button variant="outline" size="sm" onClick={() => alert('Import functionality to be implemented.')}>
              <Upload className="h-4 w-4 mr-2" /> {t('common.import')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => alert('Export functionality to be implemented.')}>
              <Download className="h-4 w-4 mr-2" /> {t('common.export')}
            </Button>
            ${
              isPopup
                ? `<Button size="sm" onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> {t('common.new')} {t('models.${singleModel}')}</Button>`
                : `<Button asChild size="sm"><Link to="/${singleModel}/create"><Plus className="h-4 w-4 mr-2" /> {t('common.new')} {t('models.${singleModel}')}</Link></Button>`
            }
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
            <TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>)) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">{t('common.noResults')}</TableCell></TableRow>)}</TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between space-x-4 py-4">
          <div className="text-sm text-muted-foreground">{t('common.selected', { count: table.getFilteredSelectedRowModel().rows.length, total: table.getFilteredRowModel().rows.length })}</div>
          <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>{t('common.previous')}</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>{t('common.next')}</Button></div>
        </div>
      </div>
      
      <Dialog open={!!viewingRow} onOpenChange={isOpen => !isOpen && setViewingRow(null)}>
        <DialogContent className="sm:max-w-md p-0">
          <DialogHeader className="p-6 pb-4"><DialogTitle>{t('form.viewTitle', { model: t('models.${singleModel}') })}</DialogTitle></DialogHeader>
          <div className="border-y"><div className="grid auto-rows-min gap-y-4 p-6">
            ${fieldsForDialog
              .map(
                (field) =>
                  `<div className="grid grid-cols-2 items-start gap-x-4"><span className="text-muted-foreground">${
                    field.label
                  }</span><p className="font-medium">{String(viewingRow?.${sanitizeFieldName(
                    field.fieldName
                  )} ?? '')}</p></div>`
              )
              .join("")}
          </div></div>
          <DialogFooter className="sm:justify-end gap-2 p-6 pt-4"><Button variant="outline" onClick={() => setViewingRow(null)}>{t('common.cancel')}</Button><Button asChild><Link to={\`/${singleModel}/edit/\${viewingRow?.id}\`}><Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}</Link></Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle><AlertDialogDescription>{t('common.areYouSureDescription')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setItemToDelete(null)}>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>{t('common.continue')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      ${
        isPopup
          ? `
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
        {/* --- UPDATED: Drawer width increased from 500px to 720px --- */}
        <DrawerContent className="w-[720px] max-w-full h-full">
          <DrawerHeader>
            <DrawerTitle>{editingRow ? t('form.editTitle', { model: t('models.${singleModel}') }) : t('form.createTitle', { model: t('models.${singleModel}') })}</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 overflow-y-auto">
            <${formComponentName}
              initialData={editingRow || {}}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>`
          : ""
      }
    </>
  )
}
`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const newFilePath = path.join(outputDir, `${componentName}.tsx`);
  fs.writeFileSync(newFilePath, componentContent, "utf8");
  console.log(`✅ Generated Data Table for ${modelName} at: ${newFilePath}`);
}