"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatBytes } from "@/lib/format";
import { FileItem } from "@/types/file";
import {
    ColumnDef,
    ColumnFiltersState,
    RowSelectionState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
    ArrowUpDown,
    Download,
    FileIcon,
    FolderIcon,
    MoreVertical,
    Share2,
    Trash,
} from "lucide-react";
import { useMemo, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FileTableProps {
  data: FileItem[];
  onDelete: (id: string) => void;
  onDownload: (id: string, name: string) => void;
  onNavigate: (id: string) => void;
  onPreview?: (item: FileItem) => void;
  onShare: (item: FileItem) => void;
  selectedItems: RowSelectionState;
  onSelectionChange: (selection: RowSelectionState) => void;
}

export function FileTable({
  data,
  onDelete,
  onDownload,
  onNavigate,
  onPreview,
  onShare,
  selectedItems,
  onSelectionChange,
}: FileTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const lastSelectedIdRef = useRef<string | null>(null);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  const handleRowClick = useCallback(
    (e: React.MouseEvent, row: { id: string; original: FileItem; index: number }, allRows: { id: string }[]) => {
      if (e.shiftKey && lastSelectedIdRef.current) {
        // Shift+Click: select range
        const lastIdx = allRows.findIndex((r) => r.id === lastSelectedIdRef.current);
        const currentIdx = allRows.findIndex((r) => r.id === row.id);
        if (lastIdx !== -1 && currentIdx !== -1) {
          const [start, end] = lastIdx < currentIdx ? [lastIdx, currentIdx] : [currentIdx, lastIdx];
          const newSelection: RowSelectionState = { ...selectedItems };
          for (let i = start; i <= end; i++) {
            newSelection[allRows[i].id] = true;
          }
          onSelectionChange(newSelection);
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+Click: toggle single without affecting others
        const newSelection: RowSelectionState = { ...selectedItems };
        if (newSelection[row.id]) {
          delete newSelection[row.id];
        } else {
          newSelection[row.id] = true;
        }
        onSelectionChange(newSelection);
        lastSelectedIdRef.current = row.id;
      } else {
        // Normal click: select only this row (deselect others)
        if (selectedItems[row.id] && Object.keys(selectedItems).length === 1) {
          onSelectionChange({});
          lastSelectedIdRef.current = null;
        } else {
          onSelectionChange({ [row.id]: true });
          lastSelectedIdRef.current = row.id;
        }
      }
    },
    [selectedItems, onSelectionChange],
  );

  const handleRowDoubleClick = useCallback(
    (item: FileItem) => {
      if (item.type === "folder") {
        onNavigate(item.id);
      } else if (onPreview) {
        onPreview(item);
      }
    },
    [onNavigate, onPreview],
  );

  const columns: ColumnDef<FileItem>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table: tbl }) => {
        const allSelected = tbl.getIsAllPageRowsSelected();
        const someSelected = tbl.getIsSomePageRowsSelected();
        return (
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(value) => tbl.toggleAllPageRowsSelected(!!value)}
            aria-label="Selecionar todos"
            onClick={(e) => e.stopPropagation()}
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div className="flex flex-col space-y-2 py-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="p-0 hover:bg-transparent font-semibold text-muted-foreground h-auto justify-start"
            >
              Nome do Arquivo
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
            <Input
              placeholder="Filtrar nome..."
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className="max-w-[200px] h-8 text-xs bg-muted/30 border-none shadow-none focus-visible:ring-1"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )
      },
      cell: ({ row }) => {
        const item = row.original;
        const Icon = item.type === "folder" ? FolderIcon : FileIcon;
        return (
          <div className="flex items-center gap-3 py-1 group">
            <div className={`p-2 rounded-xl transition-colors duration-200 ${item.type === "folder" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20" : "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-500/20"}`}>
               <Icon className={`h-5 w-5 ${item.type === "folder" ? "fill-blue-500/20" : ""}`} />
            </div>
            <span className="font-semibold text-[14px] text-foreground/90 group-hover:text-primary transition-colors">{item.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => {
        return (
          <div className="flex flex-col space-y-2 py-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="p-0 hover:bg-transparent font-semibold text-muted-foreground h-auto justify-start"
            >
              Tipo
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const item = row.original;
        const mimeType = item.mimeType || "";
        let typeLabel = "Arquivo";
        let typeColor = "bg-zinc-100/50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400";

        if (item.type === "folder") {
          typeLabel = "Pasta";
          typeColor = "bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
        }
        else if (mimeType.includes("pdf")) {
           typeLabel = "PDF";
           typeColor = "bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        }
        else if (mimeType.includes("image")) {
           typeLabel = "Imagem";
           typeColor = "bg-purple-100/50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
        }
        else if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
           typeLabel = "Planilha";
           typeColor = "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
        }
        else if (mimeType.includes("word") || mimeType.includes("document")) {
           typeLabel = "Documento";
           typeColor = "bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
        }

        return (
          <span className={`text-[12px] font-medium px-2.5 py-1 rounded-md ${typeColor}`}>
            {typeLabel}
          </span>
        )
      },
    },
    {
      accessorKey: "size",
      header: ({ column }) => {
        return (
           <div className="flex flex-col space-y-2 py-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="p-0 hover:bg-transparent font-semibold text-muted-foreground h-auto justify-start"
            >
              Tamanho
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground font-medium">
          {row.original.type === "folder"
            ? "-"
            : formatBytes(row.original.size)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
           <div className="flex flex-col space-y-2 py-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="p-0 hover:bg-transparent font-semibold text-muted-foreground h-auto justify-start"
            >
              Modificado em
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground font-medium">
          {format(new Date(row.original.updatedAt || row.original.createdAt), "dd MMM yyyy, HH:mm")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-muted/50 data-[state=open]:bg-muted/80" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-2 rounded-xl shadow-xl shadow-black/5 dark:shadow-black/20">
              {item.type === "file" && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDownload(item.id, item.name); }}
                  className="rounded-lg cursor-pointer py-2.5"
                >
                  <Download className="mr-2.5 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Baixar</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                 onClick={(e) => { e.stopPropagation(); onShare(item); }}
                 className="rounded-lg cursor-pointer py-2.5"
              >
                <Share2 className="mr-2.5 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Compartilhar</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer py-2.5 mt-1"
              >
                <Trash className="mr-2.5 h-4 w-4" />
                <span className="font-medium">Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [onDelete, onDownload, onShare]);

  const table = useReactTable({
    data: sortedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const newValue = typeof updater === "function" ? updater(selectedItems) : updater;
      onSelectionChange(newValue);
    },
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnFilters,
      rowSelection: selectedItems,
    },
  });

  return (
    <div className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/20 hover:bg-muted/20">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b-muted/50">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="h-14" style={header.column.id === "select" ? { width: 40 } : undefined}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`border-b-muted/50 hover:bg-muted/20 transition-colors duration-200 cursor-pointer select-none ${
                    row.getIsSelected() ? "border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
                  }`}
                  onClick={(e) => handleRowClick(e, row, table.getRowModel().rows)}
                  onDoubleClick={() => handleRowDoubleClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="p-4 rounded-full bg-muted/50">
                       <FolderIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">Pasta vazia. Arraste arquivos aqui para enviar.</p>
                  </motion.div>
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
