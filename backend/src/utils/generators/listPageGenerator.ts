// src/utils/generators/listPageGenerator.ts

import fs from "fs";
import path from "path";
import { Field } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateListPage(modelName: string, fields: Field[]): void {
  const componentName = `${capitalize(modelName)}DataTable`;
  const singleModel = modelName.toLowerCase();
  const primaryField = fields[0]?.fieldName || 'id';

  // The columns definition remains the same.
  const columnsDefinition = `
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Pencil, Copy, Trash2, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Link } from "react-router-dom"

export const columns: ColumnDef<any>[] = [
  { 
    id: "select", 
    header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />, 
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />, 
    enableSorting: false, 
    enableHiding: false 
  },
  ${fields.slice(0, 8).map(field => `
  { 
    accessorKey: "${field.fieldName}", 
    header: "${field.label}"
  }`).join(',\n  ')},
  { 
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon" title="View">
          <Link to={"/${singleModel}/edit/" + row.original.id}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" title="Edit">
          <Link to={"/${singleModel}/edit/" + row.original.id}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" title="Copy">
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy</span>
        </Button>
        <Button variant="ghost" size="icon" title="Delete" className="text-red-600 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    )
  }
]`;

  const placeholderData = `
// TODO: This is placeholder data. Fetch your real data from an API.
const data = [
  { id: 1, ${fields.slice(0, 8).map(f => `${f.fieldName}: "Sample ${f.label} 1"`).join(', ')} },
  { id: 2, ${fields.slice(0, 8).map(f => `${f.fieldName}: "Sample ${f.label} 2"`).join(', ')} },
  { id: 3, ${fields.slice(0, 8).map(f => `${f.fieldName}: "Sample ${f.label} 3"`).join(', ')} },
];
`;

  // UPDATED: The component content, specifically the renderCard function, is fixed.
  const componentContent = `
import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { SortingState, ColumnFiltersState, Row } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { Plus, FileDown, Upload, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { columns } from "./columns" 

${placeholderData}

export function ${componentName}() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
  })

  // Reusable card renderer for mobile view
  const renderCard = (row: Row<any>) => (
    <div key={row.id} className="border bg-card rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="font-bold text-lg flex items-center">
            {/* FIXED: Iterate over the filtered cell to get its context correctly */}
            {row.getVisibleCells().filter(cell => cell.column.id === 'select').map(cell => (
              <div key={cell.id} className="mr-3">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
            {row.getValue("${primaryField}")}
        </div>
        <div className="flex items-center">
            {/* FIXED: Iterate over the filtered cell to get its context correctly */}
            {row.getVisibleCells().filter(cell => cell.column.id === 'actions').map(cell => (
              <div key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
        </div>
      </div>
      <div className="space-y-3">
        {row.getVisibleCells()
          .filter(cell => !['select', 'actions', '${primaryField}'].includes(cell.column.id))
          .map(cell => (
            <div key={cell.id} className="flex justify-between text-sm">
              <div className="text-muted-foreground font-medium">
                {flexRender(cell.column.columnDef.header, cell.getContext())}
              </div>
              <div className="text-right">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            </div>
          ))}
      </div>
    </div>
  )

  return (
    <div className="w-full bg-card border rounded-xl shadow-sm p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
        <Input
          placeholder="Filter by ${primaryField}..."
          value={(table.getColumn("${primaryField}")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("${primaryField}")?.setFilterValue(event.target.value)}
          className="w-full md:max-w-sm"
        />
        <div className="flex items-center gap-2 self-end md:self-auto">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button variant="destructive" size="sm">
              Delete ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Import</Button>
          <Button variant="outline" size="sm"><FileDown className="h-4 w-4 mr-2" />Export</Button>
          <Button asChild size="sm">
            <Link to="/${singleModel}/create">
              <Plus className="h-4 w-4 mr-2" />Create New
            </Link>
          </Button>
        </div>
      </div>

      {/* Table view for desktop with sorting buttons */}
      <div className="rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : 
                        canSort ? (
                          <Button variant="ghost" onClick={() => header.column.toggleSorting(header.column.getIsSorted() === "asc")}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )
                      }
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Card view for mobile */}
      <div className="block md:hidden">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map(renderCard)
        ) : (
          <div className="text-center p-8 border rounded-md">No results.</div>
        )}
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </div>
  )
}
`;

  const columnsContent = `
${columnsDefinition}
`;

  const outputDir = path.join(getBaseDir(), "src", "components", "generated");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(path.join(outputDir, `${componentName}.tsx`), componentContent, "utf8");
  fs.writeFileSync(path.join(outputDir, `columns.tsx`), columnsContent, "utf8");
  
  console.log(`✅ Generated bug-fixed Data Table for ${modelName}.`);
}