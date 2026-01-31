"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { SearchToolbar } from "@/components/shared/SearchToolbar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { DateInput } from "@/components/shared/DateInput";
import { SelectField } from "@/components/shared/SelectField";
import { BarChart3, TrendingUp, FileText, Download, Calendar } from "lucide-react";

// Types
interface ReportSummary {
  id: string;
  name: string;
  type: string;
  lastGenerated: string;
  records: number;
  status: "Ready" | "Generating" | "Scheduled";
}

export default function ReportsPage() {
  // Mock Data
  const [reports] = useState<ReportSummary[]>([
    { id: "RPT-001", name: "Monthly Stock Summary", type: "Inventory", lastGenerated: "2026-01-30", records: 1248, status: "Ready" },
    { id: "RPT-002", name: "Requisition Analysis", type: "Requisition", lastGenerated: "2026-01-28", records: 156, status: "Ready" },
    { id: "RPT-003", name: "Movement History", type: "Inventory", lastGenerated: "2026-01-25", records: 432, status: "Ready" },
    { id: "RPT-004", name: "Low Stock Alert", type: "Inventory", lastGenerated: "2026-01-30", records: 15, status: "Generating" },
    { id: "RPT-005", name: "Supplier Performance", type: "Receiving", lastGenerated: "2025-12-15", records: 28, status: "Ready" },
    { id: "RPT-006", name: "Annual Inventory Report", type: "Inventory", lastGenerated: "2025-11-30", records: 5420, status: "Ready" },
    { id: "RPT-007", name: "Q3 Requisition Summary", type: "Requisition", lastGenerated: "2025-10-01", records: 342, status: "Ready" },
    { id: "RPT-008", name: "Material Cost Analysis", type: "Analytics", lastGenerated: "2025-08-15", records: 890, status: "Scheduled" },
  ]);

  // State
  const [searchValue, setSearchValue] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportTypes] = useState(["Activity", "Analytics", "Inventory", "Receiving", "Requisition"]);
  const [selectedReportType, setSelectedReportType] = useState("");

  // Table Columns
  const columns: Column<ReportSummary>[] = [
    { key: "name", header: "Report Name" },
    { 
      key: "type", 
      header: "Type", 
      align: "center",
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {val}
        </span>
      )
    },
    { key: "lastGenerated", header: "Last Generated", type: "date", align: "center" },
    { key: "records", header: "Records", align: "center" },
    { 
      key: "status", 
      header: "Status", 
      align: "center",
      render: (val) => {
        const styles: Record<string, string> = {
          Ready: "bg-emerald-50 text-emerald-700 border-emerald-100",
          Generating: "bg-blue-50 text-blue-700 border-blue-100 animate-pulse",
          Scheduled: "bg-amber-50 text-amber-700 border-amber-100",
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[val] || ""}`}>
            {val}
          </span>
        );
      }
    },
  ];

  // Filter data
  const filteredData = reports.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchValue.toLowerCase());
    const matchesYear = filterYear === "All" || report.lastGenerated.startsWith(filterYear);
    return matchesSearch && matchesYear;
  });

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <ModuleHeader
            title="Reports"
            description="Stock, movements, requisitions, and operational analytics."
          >
            <div className="space-y-6 mt-8">
              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Available Reports</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">12</h3>
                    <p className="text-xs text-slate-400 mt-1">Pre-configured</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Generated Today</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">5</h3>
                    <p className="text-xs text-emerald-600 mt-1 font-medium">All successful</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Scheduled</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">3</h3>
                    <p className="text-xs text-blue-500 mt-1 font-medium">Daily/Weekly</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </GlassCard>
              </div>

              {/* Date Range Filter */}
              <GlassCard className="p-4 relative z-30">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Quick Report Generator</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <SelectField
                    label="Report Type"
                    value={selectedReportType}
                    options={reportTypes}
                    onChange={setSelectedReportType}
                    placeholder="Select type..."
                  />
                  <DateInput
                    label="From Date"
                    value={dateFrom}
                    onChange={setDateFrom}
                  />
                  <DateInput
                    label="To Date"
                    value={dateTo}
                    onChange={setDateTo}
                  />
                  <div className="flex items-end">
                    <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </GlassCard>

              {/* Search Toolbar */}
              <SearchToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search reports..."
                filterValue={filterYear}
                onFilterChange={setFilterYear}
                primaryButton={{
                  label: "Export All",
                  icon: <Download className="w-4 h-4" />,
                  onClick: () => console.log("Export all"),
                }}
              />

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={filteredData}
                keyField="id"
                onRowClick={(row) => console.log("View report", row)}
                emptyMessage="No reports found"
              />
            </div>
          </ModuleHeader>
        </div>
      </section>
    </div>
  );
}
