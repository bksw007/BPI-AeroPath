"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * SearchToolbar Component
 * 
 * แถบเครื่องมือแบบ Combo: Search | Filter (Year) | Primary Button
 * Filter ตั้งค่าปีนี้เป็นค่าเริ่มต้น
 * 
 * @param searchValue - ค่า search
 * @param onSearchChange - callback เมื่อ search เปลี่ยน
 * @param searchPlaceholder - placeholder สำหรับช่อง search
 * @param filterValue - ปีที่เลือก (filter)
 * @param onFilterChange - callback เมื่อ filter เปลี่ยน
 * @param filterOptions - รายการปี (ถ้าไม่กำหนดจะสร้างอัตโนมัติ 5 ปีล่าสุด)
 * @param primaryButton - config สำหรับปุ่มหลัก
 * @param className - additional classes
 */

interface PrimaryButtonConfig {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface SearchToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: string[];
  primaryButton?: PrimaryButtonConfig;
  className?: string;
}

export function SearchToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filterValue,
  onFilterChange,
  filterOptions,
  primaryButton,
  className,
}: SearchToolbarProps) {
  const currentYear = new Date().getFullYear().toString();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  // สร้าง filter options อัตโนมัติ (5 ปีล่าสุด + "All")
  const yearOptions = useMemo(() => {
    if (filterOptions) return filterOptions;
    const years: string[] = ["All"];
    for (let i = 0; i < 5; i++) {
      years.push((new Date().getFullYear() - i).toString());
    }
    return years;
  }, [filterOptions]);

  // Default filter = ปีนี้
  const selectedFilter = filterValue ?? currentYear;

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-4 justify-between items-center bg-white/40 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-sm relative z-20",
        className
      )}
    >
      {/* Left: Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        {/* Search Field */}
        <div className="relative flex-1 sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-slate-700 placeholder-slate-400 text-sm"
          />
        </div>

        {/* Filter Dropdown */}
        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-white/30 rounded-lg text-sm text-slate-600 hover:bg-white/70 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>{selectedFilter === "All" ? "All Years" : selectedFilter}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isFilterOpen && "rotate-180")} />
          </button>

          {isFilterOpen && (
            <div className="absolute z-[100] mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden">
              {yearOptions.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    onFilterChange?.(year);
                    setIsFilterOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm hover:bg-indigo-50",
                    selectedFilter === year && "bg-indigo-100 text-indigo-700 font-medium"
                  )}
                >
                  {year === "All" ? "All Years" : year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Primary Button */}
      {primaryButton && (
        <button
          onClick={primaryButton.onClick}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          {primaryButton.icon}
          {primaryButton.label}
        </button>
      )}
    </div>
  );
}

