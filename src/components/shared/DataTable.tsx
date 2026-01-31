"use client";

import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/formatters";
import { GlassCard } from "./GlassCard";

/**
 * DataTable Component
 * 
 * ตารางข้อมูลมาตรฐานที่:
 * - ❌ ไม่มี Action column
 * - ❌ ไม่มี Footer
 * - ✅ คลิกแถวเพื่อดูรายละเอียด (onRowClick)
 * - ✅ Date columns ใช้ formatDate (dd-MM-yyyy)
 * - ✅ Glassmorphism styling
 * 
 * @param columns - คอลัมน์ของตาราง
 * @param data - ข้อมูล
 * @param onRowClick - callback เมื่อคลิกแถว
 * @param keyField - ฟิลที่ใช้เป็น unique key
 * @param emptyMessage - ข้อความเมื่อไม่มีข้อมูล
 */

export interface Column<T> {
  key: keyof T | string;
  header: string;
  align?: "left" | "center" | "right";
  type?: "text" | "date" | "badge";
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyField: keyof T;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  keyField,
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  // Helper: Get cell value
  const getCellValue = (row: T, column: Column<T>) => {
    const rawValue = row[column.key as keyof T];

    // Custom render function
    if (column.render) {
      return column.render(rawValue, row);
    }

    // Date formatting
    if (column.type === "date" && rawValue) {
      return formatDate(rawValue);
    }

    // Default: return as-is
    return rawValue ?? "-";
  };

  // Helper: Get alignment class
  const getAlignClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <GlassCard className={cn("overflow-hidden p-0", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-600">
          {/* Header */}
          <thead className="bg-slate-100/50 border-b border-indigo-100 uppercase text-xs tracking-wider font-semibold text-slate-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn("px-6 py-4", getAlignClass(col.align), col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-indigo-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={String(row[keyField])}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors",
                    onRowClick && "hover:bg-indigo-50/50 cursor-pointer group"
                  )}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-6 py-4",
                        getAlignClass(col.align),
                        col.className,
                        // First column: highlight on hover
                        colIndex === 0 && onRowClick && "font-medium text-indigo-600 group-hover:text-indigo-800"
                      )}
                    >
                      {getCellValue(row, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
