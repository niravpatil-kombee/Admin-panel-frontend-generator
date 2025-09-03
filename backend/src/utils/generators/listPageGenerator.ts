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
          const tsType = mapToTsType(f.zodType);
          if (tsType === "number") {
            return `${sName}: ${10 + i}`;
          }
          if (tsType === "boolean") {
            return `${sName}: ${i % 2 === 0 ? "true" : "false"}`;
          }
          return `${sName}: "${capitalize(f.fieldName.replace(/_/g, " "))} ${
            i + 1
          }"`;
        })
        .join(", ")} }`
  ).join(",\n  ")}\n];`;

  // Generate different imports based on isPopup flag
  const formImports = isPopup
    ? `import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"`
    : `import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom"`;

  // State variables based on form type
  const stateVariables = isPopup
    ? `  const [isFormDrawerOpen, setIsFormDrawerOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<${modelTypeName} | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);`
    : `  const navigate = useNavigate();
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);`;

  // Create and Edit handlers based on form type
  const createEditHandlers = isPopup
    ? `  const handleCreate = () => {
    setEditingRow(null);
    setIsFormDrawerOpen(true);
  };

const handleView = (id: any) => {
  const row = data.find(item => item.id === id);
  if (!row) return;
  setViewingRow(row);
  setIsViewDrawerOpen(true);
};`
    : `  const handleCreate = () => {
    navigate(\`/${singleModel}/create\`);
  };

  const handleEdit = (id: any) => {
    navigate(\`/${singleModel}/edit/\${id}\`);
  };
  `;

  // View handler based on form type
  const viewHandler = isPopup
    ? `  const handleEdit = (id: any) => {
  const row = data.find(item => item.id === id);
  if (!row) return;
  setEditingRow(row);
  setIsFormDrawerOpen(true);
};
`
    : `  
   const handleView = (id: any) => {
  const row = data.find(item => item.id === id);
  if (!row) return;
  setViewingRow(row);
  setIsViewDialogOpen(true);
};

  `;

  // Form submit handler (only needed for popup forms)
  const formSubmitHandler = isPopup
    ? `  const handleFormSubmit = (values: any) => {
    console.log("Form submitted:", values);
    if (editingRow) {
      // Update existing item
      setData(d => d.map(item => item.id === editingRow.id ? { ...item, ...values } : item));
    } else {
      // Create new item
      const newItem = { ...values, id: Math.max(...data.map(d => Number(d.id))) + 1 };
      setData(d => [...d, newItem]);
    }
    setIsFormDrawerOpen(false);
    setEditingRow(null);
  };`
    : ``;

  const componentContent = `
import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus, Eye, Pencil, Trash2, Upload, Download, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
${formImports}
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
${
  isPopup
    ? `import { ${formComponentName} } from "@/components/forms/${modelDirName}/${formComponentName}";`
    : ""
}

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
${stateVariables}
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

${createEditHandlers}

${viewHandler}

${formSubmitHandler}

  const handleDeleteRow = (id: any) => { setItemToDelete(id); setIsAlertOpen(true); };
  const handleDeleteSelected = () => { 
    const ids = table.getFilteredSelectedRowModel().rows.map(r => r.original.id); 
    setItemToDelete(ids); 
    setIsAlertOpen(true); 
  };
  const confirmDelete = () => { 
    if (!itemToDelete) return; 
    if (Array.isArray(itemToDelete)) { 
      const idSet = new Set(itemToDelete); 
      setData(d => d.filter(item => !idSet.has(item.id))); 
      table.resetRowSelection(); 
    } else { 
      setData(d => d.filter(item => item.id !== itemToDelete)); 
    } 
    setIsAlertOpen(false); 
    setItemToDelete(null); 
  };

  const columns: ColumnDef<${modelTypeName}>[] = React.useMemo(() => [
    { 
      id: "select", 
      header: ({ table }) => (
        <Checkbox 
          checked={table.getIsAllPageRowsSelected()} 
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)} 
        />
      ), 
      cell: ({ row }) => (
        <Checkbox 
          checked={row.getIsSelected()} 
          onCheckedChange={v => row.toggleSelected(!!v)} 
        />
      ), 
      enableSorting: false 
    },
    ${fieldsForListing
      .map((field) => {
        const displayKey = field.fieldName.endsWith("_id")
          ? field.fieldName.replace(/_id$/, "")
          : field.fieldName;
        return `{ 
      accessorKey: "${sanitizeFieldName(field.fieldName)}", 
      header: ({ column }) => (${
        field.sortable
          ? `<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-medium">
              {t("${singleModel}.fields.${displayKey}")}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>`
          : `<span className="font-medium">{t("${singleModel}.fields.${displayKey}")}</span>`
      }),
      ${
        field.sortable
          ? `cell: ({ getValue }) => (<div className="pl-4">{String(getValue() ?? '')}</div>)`
          : `cell: ({ getValue }) => String(getValue() ?? '')`
      }
    }`;
      })
      .join(",\n    ")},
    { 
      id: "actions", 
      header: () => <div className="text-right">{t('common.actions')}</div>, 
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" title={t('common.view')} onClick={() => handleView(row.original.id)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title={t('common.edit')} onClick={() => handleEdit(row.original.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title={t('common.delete')} className="text-red-600" onClick={() => handleDeleteRow(row.original.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) 
    },
  ], [t]);

  const table = useReactTable({ 
    data, 
    columns, 
    onSortingChange: setSorting, 
    onColumnFiltersChange: setColumnFilters, 
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(), 
    getPaginationRowModel: getPaginationRowModel(), 
    getSortedRowModel: getSortedRowModel(), 
    getFilteredRowModel: getFilteredRowModel(), 
    state: { sorting, columnFilters, rowSelection } 
  });

  const MobileCard = ({ row }: { row: any }) => {
    const item = row.original;
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
              />
              <div className="font-medium text-base">ID: {item.id}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleView(item.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('common.view')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(item.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteRow(item.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            ${fieldsForListing
              .map((field) => {
                const displayKey = field.fieldName.endsWith("_id")
                  ? field.fieldName.replace(/_id$/, "")
                  : field.fieldName;
                return `<div className="flex justify-between items-start py-1">
              <span className="text-sm text-muted-foreground font-medium min-w-0 flex-shrink-0 pr-2">
                {t("${singleModel}.fields.${displayKey}")}
              </span>
              <span className="text-sm text-right min-w-0 flex-1 break-words">
                {String(item.${sanitizeFieldName(field.fieldName)} ?? '')}
              </span>
            </div>`;
              })
              .join("")}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="w-full rounded-xl border bg-card shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
          <h1 className="text-xl sm:text-2xl font-bold">{t('table.manageTitle', { model: t('models.${singleModel}_plural') })}</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {(table.getFilteredSelectedRowModel().rows.length > 0) && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="w-full sm:w-auto">
                {t('table.deleteSelected', { count: table.getFilteredSelectedRowModel().rows.length })}
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => alert('Import functionality to be implemented.')} className="flex-1 sm:flex-none">
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('common.import')}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert('Export functionality to be implemented.')} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('common.export')}</span>
              </Button>
              <Button size="sm" onClick={handleCreate} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('common.new')} {t('models.${singleModel}')}</span>
                <span className="sm:hidden">{t('common.new')}</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => (
                    <TableHead key={h.id} className="whitespace-nowrap">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? // Changed to > 0 for clarity, although length is truthy
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {t('common.noResults')}
                    </TableCell>
                  </TableRow> // Corrected: closing TableRow tag here
                )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {table.getRowModel().rows.length > 0 ? (
            <div className="space-y-4">
              {table.getRowModel().rows.map(row => (
                <MobileCard key={row.id} row={row} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.noResults')}
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            {t('common.selected', { 
              count: table.getFilteredSelectedRowModel().rows.length, 
              total: table.getFilteredRowModel().rows.length 
            })}
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => table.previousPage()} 
              disabled={!table.getCanPreviousPage()}
            >
              {t('common.previous')}
            </Button>
            <div className="text-sm text-muted-foreground px-2">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => table.nextPage()} 
              disabled={!table.getCanNextPage()}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      </div>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>{t('common.areYouSureDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('common.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      ${generateViewContainer(isPopup, fieldsForDialog, singleModel)}

      ${generateFormContainer(isPopup, formComponentName, singleModel)}
    </>
  )
}`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const newFilePath = path.join(outputDir, `${componentName}.tsx`);
  fs.writeFileSync(newFilePath, componentContent, "utf8");

  const formType = isPopup ? "with Drawer Form" : "with Page Navigation";
  console.log(
    `✅ Generated Data Table ${formType} for ${modelName} at: ${newFilePath}`
  );
}

function generateViewContainer(
  isPopup: boolean,
  fieldsForDialog: Field[],
  singleModel: string
): string {
  const containerType = isPopup ? "Drawer" : "Dialog";
  const containerState = isPopup ? "isViewDrawerOpen" : "isViewDialogOpen";
  const containerSetter = isPopup
    ? "setIsViewDrawerOpen"
    : "setIsViewDialogOpen";

  if (isPopup) {
    return `
      {/* View Drawer */}
      <Drawer open={${containerState}} onOpenChange={${containerSetter}} direction="right">
        <DrawerContent className="w-full sm:w-[500px] ml-auto h-full">
          <DrawerHeader>
            <DrawerTitle>{t('form.viewTitle', { model: t('models.${singleModel}') })}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 sm:p-6 overflow-y-auto">
            <div className="grid auto-rows-min gap-y-4 sm:gap-y-6">
              ${fieldsForDialog
                .map((field) => {
                  const displayKey = field.fieldName.endsWith("_id")
                    ? field.fieldName.replace(/_id$/, "")
                    : field.fieldName;
                  const sanitizedFieldName = sanitizeFieldName(field.fieldName);
                  return `<div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-x-4">
                <span className="text-sm font-medium text-muted-foreground">{t("${singleModel}.fields.${displayKey}")}</span>
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-sm">{String(viewingRow?.${sanitizedFieldName} ?? '')}</p>
                </div>
              </div>`;
                })
                .join("")}
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-6 mt-6 border-t">
              <Button variant="outline" onClick={() => ${containerSetter}(false)} className="w-full sm:w-auto">
                {t('common.close')}
              </Button>
              <Button 
                onClick={() => { 
                  if (viewingRow) {
                    ${containerSetter}(false);
                    handleEdit(viewingRow.id); 
                  }
                }}
                className="w-full sm:w-auto"
              >
                <Pencil className="mr-2 h-4 w-4" /> 
                {t('common.edit')}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>`;
  } else {
    return `
      {/* View Dialog */}
      <Dialog open={${containerState}} onOpenChange={${containerSetter}}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('form.viewTitle', { model: t('models.${singleModel}') })}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid auto-rows-min gap-y-6">
              ${fieldsForDialog
                .map((field) => {
                  const displayKey = field.fieldName.endsWith("_id")
                    ? field.fieldName.replace(/_id$/, "")
                    : field.fieldName;
                  const sanitizedFieldName = sanitizeFieldName(field.fieldName);
                  return `<div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-x-4">
                <span className="text-sm font-medium text-muted-foreground">{t("${singleModel}.fields.${displayKey}")}</span>
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-sm">{String(viewingRow?.${sanitizedFieldName} ?? '')}</p>
                </div>
              </div>`;
                })
                .join("")}
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 mt-6 border-t">
              <Button variant="outline" onClick={() => ${containerSetter}(false)} className="sm:w-auto">
                {t('common.close')}
              </Button>
              <Button 
                onClick={() => { 
                  if (viewingRow) {
                    ${containerSetter}(false);
                    handleEdit(viewingRow.id); 
                  }
                }}
                className="sm:w-auto"
              >
                <Pencil className="mr-2 h-4 w-4" /> 
                {t('common.edit')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>`;
  }
}

function generateFormContainer(
  isPopup: boolean,
  formComponentName: string,
  singleModel: string
): string {
  if (isPopup) {
    return `
      {/* Form Drawer */}
      <Drawer open={isFormDrawerOpen} onOpenChange={setIsFormDrawerOpen} direction="right">
        <DrawerContent className="w-full sm:w-[500px] ml-auto h-full">
          <DrawerHeader>
            <DrawerTitle>
              {editingRow ? t('form.editTitle', { model: t('models.${singleModel}') }) : t('form.createTitle', { model: t('models.${singleModel}') })}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 sm:p-6 overflow-y-auto">
            <${formComponentName}
              initialData={editingRow || {}}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>`;
  } else {
    return `
      {/* Page forms are handled by navigation - no form container needed here */}`;
  }
}
