"use client";

import { useMemo, useState } from "react";
import {
  CellContext,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type XlsxSheetPreview = {
  name: string;
  columns: string[];
  rows: string[][];
};

type XlsxPreviewViewerProps = {
  sheets: XlsxSheetPreview[];
  previewNotice?: string | null;
};

type XlsxRow = {
  rowNumber: number;
} & Record<string, string | number>;

export function XlsxPreviewViewer({
  sheets,
  previewNotice,
}: XlsxPreviewViewerProps) {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const activeSheet = sheets[activeSheetIndex] ?? sheets[0];

  const { columns, data } = useMemo(() => {
    if (!activeSheet) {
      return {
        columns: [] as ColumnDef<XlsxRow>[],
        data: [] as XlsxRow[],
      };
    }

    const spreadsheetColumns: ColumnDef<XlsxRow>[] = [
      {
        id: "rowNumber",
        accessorKey: "rowNumber",
        header: "#",
        cell: ({ getValue }) => (
          <span className="block text-center text-[11px] font-medium text-zinc-400">
            {String(getValue<number>())}
          </span>
        ),
      },
      ...activeSheet.columns.map<ColumnDef<XlsxRow>>((columnLabel, index) => ({
        id: `col-${index}`,
        accessorKey: `col-${index}`,
        header: columnLabel,
        cell: ({ getValue }: CellContext<XlsxRow, string | number>) => {
          const value = String(getValue() ?? "");
          return (
            <span
              className={cn(
                "block truncate text-[11px] leading-5 text-zinc-600",
                !value && "text-zinc-200",
              )}
            >
              {value || "—"}
            </span>
          );
        },
      })),
    ];

    const spreadsheetRows: XlsxRow[] = activeSheet.rows.map((row, rowIndex) => ({
      rowNumber: rowIndex + 1,
      ...Object.fromEntries(
        activeSheet.columns.map((_, columnIndex) => [
          `col-${columnIndex}`,
          row[columnIndex] ?? "",
        ]),
      ),
    }));

    return {
      columns: spreadsheetColumns,
      data: spreadsheetRows,
    };
  }, [activeSheet]);

  // TanStack Table exposes imperative helpers that trigger the React Compiler compatibility lint.
  // This viewer is local state only, so a scoped suppression is appropriate here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!activeSheet) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-zinc-500">
        시트 데이터를 표시할 수 없습니다.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f6f6f6]">
      {previewNotice ? (
        <div className="border-b border-zinc-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
          {previewNotice}
        </div>
      ) : null}
      {sheets.length > 1 ? (
        <div className="border-b border-zinc-200 bg-white px-4 py-2.5">
          <div className="flex flex-wrap gap-2">
            {sheets.map((sheet, index) => (
              <button
                key={sheet.name}
                type="button"
                onClick={() => setActiveSheetIndex(index)}
                className={cn(
                  "inline-flex h-7 items-center rounded-md border px-2.5 text-[11px] font-medium transition",
                  index === activeSheetIndex
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-900",
                )}
              >
                Sheet {index + 1}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="inline-block min-w-full rounded-xl border border-zinc-200 bg-white shadow-sm">
          <Table className="w-max min-w-full border-separate border-spacing-0 text-xs">
            <TableHeader className="sticky top-0 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-0 bg-transparent hover:bg-transparent">
                  {headerGroup.headers.map((header, index) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-9 border-r border-b border-zinc-200 bg-[#fafafa] px-3 py-2 text-center text-[11px] font-semibold text-zinc-400 last:border-r-0",
                        index === 0 && "sticky left-0 z-30 min-w-12 bg-[#f7f7f7]",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-0 bg-transparent hover:bg-transparent">
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "min-w-17 border-r border-b border-zinc-100 px-3 py-2.5 align-middle text-center last:border-r-0",
                          index === 0 && "sticky left-0 z-10 min-w-12 bg-[#fafafa] px-2",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell
                    colSpan={activeSheet.columns.length + 1}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    비어 있는 시트입니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
