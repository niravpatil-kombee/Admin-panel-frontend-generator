// src/utils/generators/listPageGenerator.ts

import fs from "fs";
import path from "path";
import { Field } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const sanitizeFieldName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
};

function mapToTsType(zodType: Field['zodType']): string {
  switch (zodType) {
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'date': return 'string';
    case 'any': return 'any';
    default: return 'string';
  }
}

export function generateListPage(modelName: string, fields: Field[]): void {
  const componentName = `${capitalize(modelName)}DataTable`;
  const modelTypeName = capitalize(modelName);
  const singleModel = modelName.toLowerCase();
  
  const primaryDisplayField = fields.find(f => f.fieldName.toLowerCase() === 'name') || fields[1] || fields[0];
  const primaryFilterKey = sanitizeFieldName(primaryDisplayField.fieldName);

  const modelDirName = capitalize(modelName);
  const outputDir = path.join(getBaseDir(), "src", "pages", modelDirName);

  // Use all fields for a complete type definition
  const modelTypeDefinition = `
export type ${modelTypeName} = {
  ${fields.map(field => {
    const sanitizedName = sanitizeFieldName(field.fieldName);
    // Ensure id is always present and correctly typed
    if (sanitizedName.toLowerCase() === 'id') {
      return 'id: number | string;';
    }
    return `${sanitizedName}: ${mapToTsType(field.zodType)};`;
  }).join('\n  ')}
};`;

  // UPDATED: Logic to ensure 'id' is always included in mock data
  const mockData = `
const mockData: ${modelTypeName}[] = [
  ${Array.from({ length: 13 }, (_, i) => `{
    id: ${i + 1},
    ${fields.filter(f => f.fieldName.toLowerCase() !== 'id').map(f => {
      const sanitizedName = sanitizeFieldName(f.fieldName);
      return `${sanitizedName}: ${mapToTsType(f.zodType) === 'number' ? i + 10 : `"${capitalize(f.fieldName.replace(/_/g, ' '))} ${i + 1}"`}`;
    }).join(',\n    ')}
  }`).join(',\n  ')}
];`;

  const componentContent = `
import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Row,
} from "@tanstack/react-table"
import { ArrowUpDown, Plus, Upload, FileDown, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Link } from "react-router-dom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

${modelTypeDefinition}
${mockData}

export function ${componentName}() {
  const [data, setData] = React.useState<${modelTypeName}[]>(mockData);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [viewingRow, setViewingRow] = React.useState<${modelTypeName} | null>(null);

  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<null | number | string | (number | string)[]>(null);

  const handleDeleteRow = (id: number | string) => {
    setItemToDelete(id);
    setIsAlertOpen(true);
  };

  const handleDeleteSelected = () => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
    setItemToDelete(selectedIds);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (Array.isArray(itemToDelete)) {
      const selectedIds = new Set(itemToDelete);
      setData(currentData => currentData.filter(item => !selectedIds.has(item.id)));
      table.resetRowSelection();
    } else {
      setData(currentData => currentData.filter(item => item.id !== itemToDelete));
    }

    setIsAlertOpen(false);
    setItemToDelete(null);
  };

  const columns: ColumnDef<${modelTypeName}>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
      enableSorting: false,
    },
    { 
      accessorKey: "id", 
      header: "ID" 
    },
    ${fields.filter(f => f.fieldName.toLowerCase() !== 'id').slice(0, 7).map(field => `{ 
      accessorKey: "${sanitizeFieldName(field.fieldName)}", 
      header: "${field.label}" 
    }`).join(',\n    ')},
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" title="View" onClick={() => setViewingRow(row.original)}>
              <Eye className="h-4 w-4" />
          </Button>
          <Button asChild variant="ghost" size="icon" title="Edit">
              <Link to={\`/${singleModel}/edit/\${row.original.id}\`}>
                  <Pencil className="h-4 w-4" />
              </Link>
          </Button>
          <Button
              variant="ghost"
              size="icon"
              title="Delete"
              className="text-red-600 hover:text-red-500"
              onClick={() => handleDeleteRow(row.original.id)}
          >
              <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

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
    state: { sorting, columnFilters, rowSelection },
  });

  const renderCard = (row: Row<${modelTypeName}>) => (
    <div key={row.id} className="border rounded-lg p-4 mb-4 bg-card shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="font-semibold text-lg flex items-center gap-3">
          {flexRender(row.getVisibleCells().find(c => c.column.id === "select")!.column.columnDef.cell, row.getVisibleCells().find(c => c.column.id === "select")!.getContext())}
          {row.getValue("${primaryFilterKey}")}
        </div>
        <div>{flexRender(row.getVisibleCells().find(c => c.column.id === "actions")!.column.columnDef.cell, row.getVisibleCells().find(c => c.column.id === "actions")!.getContext())}</div>
      </div>
      <div className="space-y-2 text-sm">
        {row.getVisibleCells().filter(c => !["select", "actions", "${primaryFilterKey}"].includes(c.column.id)).map(c => (
          <div key={c.id} className="flex justify-between"><span className="text-muted-foreground font-medium">{flexRender(c.column.columnDef.header, c.getContext())}</span><span>{flexRender(c.column.columnDef.cell, c.getContext())}</span></div>
        ))}
      </div>
    </div>
  );

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageStart = pageIndex * pageSize + 1;
  const pageEnd = Math.min(pageStart + pageSize - 1, totalRows);

  return (
    <>
      <div className="w-full rounded-xl border bg-card shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
          <Input placeholder="Filter by ${primaryDisplayField.label.toLowerCase()}..." value={(table.getColumn("${primaryFilterKey}")?.getFilterValue() as string) ?? ""} onChange={(e) => table.getColumn("${primaryFilterKey}")?.setFilterValue(e.target.value)} className="w-full md:max-w-sm" />
          <div className="flex items-center gap-2">
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                    Delete ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
            )}
            <Button variant="outline" size="sm"><FileDown className="h-4 w-4 mr-2" /> Import</Button>
            <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" /> Export</Button>
            <Button asChild size="sm"><Link to="/${singleModel}/create"><Plus className="h-4 w-4 mr-2" /> New</Link></Button>
          </div>
        </div>

        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(header => (<TableHead key={header.id}>{header.isPlaceholder ? null : header.column.getCanSort() ? (<Button variant="ghost" onClick={() => header.column.toggleSorting(header.column.getIsSorted() === "asc")}>{flexRender(header.column.columnDef.header, header.getContext())}<ArrowUpDown className="ml-2 h-4 w-4" /></Button>) : (flexRender(header.column.columnDef.header, header.getContext()))}</TableHead>))}</TableRow>))}</TableHeader>
            <TableBody>{table.getRowModel().rows.length ? (table.getRowModel().rows.map(row => (<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>)}</TableBody>
          </Table>
        </div>

        <div className="block md:hidden">{table.getRowModel().rows.length ? (table.getRowModel().rows.map(renderCard)) : (<div className="text-center border rounded-md p-8">No results.</div>)}</div>
        
        <div className="flex items-center justify-between space-x-4 py-4">
          <div className="flex items-center gap-2">
            <Select value={\`\${pageSize}\`} onValueChange={(value) => table.setPageSize(Number(value))}>
              <SelectTrigger className="w-[75px]"><SelectValue placeholder={pageSize} /></SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map(size => <SelectItem key={size} value={\`\${size}\`}>{size}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground hidden sm:inline-block">Records per page</p>
          </div>

          <div className="flex-1 text-center text-sm text-muted-foreground">
            Showing {totalRows > 0 ? pageStart : 0} to {pageEnd} of {totalRows} Results
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
            
            {Array.from({ length: table.getPageCount() }, (_, i) => (
              <Button key={i} variant={pageIndex === i ? "default" : "outline"} size="icon" onClick={() => table.setPageIndex(i)}>
                {i + 1}
              </Button>
            ))}

            <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

     <Dialog open={!!viewingRow} onOpenChange={(isOpen) => !isOpen && setViewingRow(null)}>
        <DialogContent className="sm:max-w-md p-0">
            <DialogHeader className="p-6 pb-4">
                <DialogTitle>${modelTypeName} Details</DialogTitle>
            </DialogHeader>
            <div className="border-y">
                {viewingRow && (
                <div className="grid auto-rows-min gap-y-4 p-6">
                    {/* Use all fields for a complete view */}
                    ${fields.map(field => {
                        const sanitizedName = sanitizeFieldName(field.fieldName);
                        return `
                    <div className="grid grid-cols-2 items-start gap-x-4">
                        <span className="text-muted-foreground">${field.label}</span>
                        <p className="text-foreground font-medium break-words">{String(viewingRow.${sanitizedName} ?? '')}</p>
                    </div>`;
                    }).join('')}
                </div>
                )}
            </div>
            <DialogFooter className="sm:justify-end gap-2 p-6 pt-4">
                <Button variant="outline" onClick={() => setViewingRow(null)}>Cancel</Button>
                <Button asChild>
                <Link to={\`/${singleModel}/edit/\${viewingRow?.id}\`}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected record(s) from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  )
}
`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const newFilePath = path.join(outputDir, `${componentName}.tsx`);
  fs.writeFileSync(newFilePath, componentContent, "utf8");
  console.log(`✅ Generated Data Table for ${modelName} with updated UI at: ${newFilePath}`);
}