"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Modal } from "@/components/shared/Modal";
import { SearchToolbar } from "@/components/shared/SearchToolbar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Package, AlertTriangle, ArrowRightLeft, ReceiptText, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

// Types
interface InventoryItem {
  id: number;
  partNo: string;
  description: string;
  category: string;
  stock: number;
  unit: string;
  lastUpdated: string;
  location: string;
}

export default function InventoryPage() {
  // Mock Data
  const inventoryItems: InventoryItem[] = [
    { id: 1, partNo: "MAT-1001", description: "Aluminum Sheet Grade 1000", category: "Metals", stock: 150, unit: "Sheet", lastUpdated: "2026-01-30", location: "WH-A-01" },
    { id: 2, partNo: "MAT-1002", description: "Steel Rod 10mm", category: "Metals", stock: 300, unit: "Pcs", lastUpdated: "2026-01-28", location: "WH-A-02" },
    { id: 3, partNo: "MAT-1003", description: "Titanium Plate Grade 5", category: "Metals", stock: 45, unit: "Sheet", lastUpdated: "2026-01-25", location: "WH-A-03" },
    { id: 4, partNo: "MAT-1004", description: "Copper Wire 2mm", category: "Metals", stock: 500, unit: "M", lastUpdated: "2026-01-20", location: "WH-B-01" },
    { id: 5, partNo: "MAT-2001", description: "Hydraulic Seal Kit", category: "Seals", stock: 25, unit: "Set", lastUpdated: "2025-12-15", location: "WH-C-01" },
    { id: 6, partNo: "MAT-2002", description: "O-Ring Assortment", category: "Seals", stock: 120, unit: "Pcs", lastUpdated: "2025-11-20", location: "WH-C-02" },
    { id: 7, partNo: "MAT-3001", description: "Aircraft Rivet AN470", category: "Fasteners", stock: 2500, unit: "Pcs", lastUpdated: "2025-10-10", location: "WH-D-01" },
    { id: 8, partNo: "MAT-3002", description: "Hex Bolt M8x25", category: "Fasteners", stock: 800, unit: "Pcs", lastUpdated: "2025-08-05", location: "WH-D-02" },
  ];

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [searchValue, setSearchValue] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Table Columns
  const columns: Column<InventoryItem>[] = [
    { key: "partNo", header: "Part No." },
    { key: "description", header: "Description" },
    { 
      key: "category", 
      header: "Category", 
      align: "center",
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {val}
        </span>
      )
    },
    { key: "stock", header: "Stock", align: "center", className: "font-semibold" },
    { key: "unit", header: "Unit", align: "center" },
    { key: "lastUpdated", header: "Last Updated", align: "center", type: "date" },
  ];

  // Filter data
  const filteredData = inventoryItems.filter((item) => {
    const matchesSearch = 
      item.partNo.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.description.toLowerCase().includes(searchValue.toLowerCase());
    const matchesYear = filterYear === "All" || item.lastUpdated.startsWith(filterYear);
    return matchesSearch && matchesYear;
  });

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <ModuleHeader
            title="Inventory"
            description="Materials master data, stock levels, and movements."
          >
            <div className="space-y-6 mt-8">
              {/* Summary Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Total Items</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">1,248</h3>
                    <p className="text-xs text-slate-400 mt-1">In 12 categories</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Low Stock</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">15</h3>
                    <p className="text-xs text-red-500 mt-1 font-medium">Reorder needed</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Recent Activity</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">24</h3>
                    <p className="text-xs text-emerald-600 mt-1 font-medium">+12 from yesterday</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <ArrowRightLeft className="w-6 h-6 text-emerald-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Total Value</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">฿2.4M</h3>
                    <p className="text-xs text-slate-400 mt-1">Estimated cost</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <ReceiptText className="w-6 h-6 text-amber-600" />
                  </div>
                </GlassCard>
              </div>

              {/* Search Toolbar */}
              <SearchToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search materials..."
                filterValue={filterYear}
                onFilterChange={setFilterYear}
                primaryButton={{
                  label: "Add Material",
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => console.log("Add material"),
                }}
              />

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={filteredData}
                keyField="id"
                onRowClick={(row) => {
                  setSelectedItem(row);
                  setActiveTab("overview");
                }}
                emptyMessage="No materials found"
              />
            </div>
          </ModuleHeader>

          {/* Item Details Modal */}
          <Modal
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            title="Material Details"
            className="md:max-w-2xl"
          >
            {selectedItem && (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="grid grid-cols-2 border-b border-slate-200 -mx-6 -mt-6 mb-6">
                  <button 
                    onClick={() => setActiveTab("overview")}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center ${
                      activeTab === 'overview' 
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setActiveTab("history")}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center ${
                      activeTab === 'history' 
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    History
                  </button>
                </div>

                <div className="h-[480px]">
                  {activeTab === "overview" ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-full">
                      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase">Part Number</p>
                            <p className="font-bold text-slate-800 text-lg">{selectedItem.partNo}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase">Category</p>
                            <p className="font-medium text-blue-600">{selectedItem.category}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 uppercase mb-1">Description</p>
                          <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-100">
                            {selectedItem.description}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 border border-slate-100 rounded-lg">
                            <p className="text-xs text-slate-500">Stock</p>
                            <p className="font-bold text-emerald-600 text-xl">{selectedItem.stock}</p>
                          </div>
                          <div className="text-center p-3 border border-slate-100 rounded-lg">
                            <p className="text-xs text-slate-500">Unit</p>
                            <p className="font-medium text-slate-700">{selectedItem.unit}</p>
                          </div>
                          <div className="text-center p-3 border border-slate-100 rounded-lg">
                            <p className="text-xs text-slate-500">Location</p>
                            <p className="font-medium text-slate-700">{selectedItem.location}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 uppercase">Last Updated</p>
                          <p className="font-medium text-slate-700">{formatDate(selectedItem.lastUpdated)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-slate-100 flex gap-3 mt-auto">
                        <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                          Edit Material
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300 flex flex-col h-full">
                      <div className="flex justify-between items-center shrink-0">
                        <h4 className="text-sm font-semibold text-slate-700">Recent Movements</h4>
                        <button className="text-xs text-indigo-600 hover:underline">View All</button>
                      </div>
                      <div className="border border-slate-100 rounded-lg overflow-hidden flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left relative">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-2 font-medium">Date</th>
                              <th className="px-4 py-2 font-medium">Type</th>
                              <th className="px-4 py-2 font-medium text-right">Qty</th>
                              <th className="px-4 py-2 font-medium">By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[1,2,3,4,5,6,7,8].map((j) => (
                              <tr key={j} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2 text-slate-600">{formatDate("2026-01-30")}</td>
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${j % 2 === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {j % 2 === 0 ? 'IN' : 'OUT'}
                                  </span>
                                </td>
                                <td className={`px-4 py-2 text-right font-medium ${j % 2 === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {j % 2 === 0 ? '+' : '-'}{10 * j}
                                </td>
                                <td className="px-4 py-2 text-slate-500 text-xs">Admin</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="pt-4 border-t border-slate-100 mt-auto shrink-0">
                        <button className="w-full py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">
                          Export History
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal>
        </div>
      </section>
    </div>
  );
}
