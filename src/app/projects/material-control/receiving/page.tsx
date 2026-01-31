"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Modal } from "@/components/shared/Modal";
import { SearchToolbar } from "@/components/shared/SearchToolbar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { DateInput } from "@/components/shared/DateInput";
import { SelectField } from "@/components/shared/SelectField";
import { Package, Truck, CheckCircle2, Clock, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

// Types
interface ReceivingNote {
  id: string;
  date: string;
  poNumber: string;
  supplier: string;
  items: number;
  status: "Pending" | "Verified" | "Completed";
  receivedBy: string;
}

export default function ReceivingPage() {
  // Mock Data
  const [receivingNotes] = useState<ReceivingNote[]>([
    { id: "RN-2026-001", date: "2026-01-30", poNumber: "PO-2026-0123", supplier: "ABC Metals Co.", items: 5, status: "Pending", receivedBy: "John Doe" },
    { id: "RN-2026-002", date: "2026-01-28", poNumber: "PO-2026-0120", supplier: "Thai Steel Ltd.", items: 3, status: "Verified", receivedBy: "Jane Smith" },
    { id: "RN-2026-003", date: "2026-01-25", poNumber: "PO-2026-0115", supplier: "Global Supplies", items: 8, status: "Completed", receivedBy: "Mike Johnson" },
    { id: "RN-2025-015", date: "2025-12-15", poNumber: "PO-2025-0450", supplier: "Premium Parts", items: 4, status: "Completed", receivedBy: "Tom Brown" },
    { id: "RN-2025-014", date: "2025-11-20", poNumber: "PO-2025-0420", supplier: "ABC Metals Co.", items: 6, status: "Completed", receivedBy: "Lisa Chen" },
    { id: "RN-2025-013", date: "2025-10-08", poNumber: "PO-2025-0380", supplier: "Thai Steel Ltd.", items: 2, status: "Completed", receivedBy: "James Lee" },
  ]);

  // State
  const [searchValue, setSearchValue] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [isNewReceivingModalOpen, setIsNewReceivingModalOpen] = useState(false);
  const [selectedReceiving, setSelectedReceiving] = useState<ReceivingNote | null>(null);

  // Form State
  const [receiveDate, setReceiveDate] = useState("");
  const [suppliers, setSuppliers] = useState(["ABC Metals Co.", "Thai Steel Ltd.", "Global Supplies", "Premium Parts"]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  // Table Columns
  const columns: Column<ReceivingNote>[] = [
    { key: "id", header: "RN No." },
    { key: "date", header: "Date", type: "date" },
    { key: "poNumber", header: "PO Number" },
    { key: "supplier", header: "Supplier" },
    { key: "items", header: "Items", align: "center" },
    { 
      key: "status", 
      header: "Status", 
      align: "center",
      render: (val) => {
        const styles: Record<string, string> = {
          Pending: "bg-amber-50 text-amber-700 border-amber-100",
          Verified: "bg-blue-50 text-blue-700 border-blue-100",
          Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[val] || ""}`}>
            {val}
          </span>
        );
      }
    },
    { key: "receivedBy", header: "Received By" },
  ];

  // Filter data
  const filteredData = receivingNotes.filter((note) => {
    const matchesSearch = 
      note.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      note.poNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      note.supplier.toLowerCase().includes(searchValue.toLowerCase());
    const matchesYear = filterYear === "All" || note.date.startsWith(filterYear);
    return matchesSearch && matchesYear;
  });

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <ModuleHeader
            title="Receiving"
            description="Receive materials, attach documents, and create receiving notes."
          >
            <div className="space-y-6 mt-8">
              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Pending Verification</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">3</h3>
                    <p className="text-xs text-amber-500 mt-1 font-medium">Awaiting check</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Received Today</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">8</h3>
                    <p className="text-xs text-emerald-600 mt-1 font-medium">Items checked in</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Expected Deliveries</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">5</h3>
                    <p className="text-xs text-blue-500 mt-1 font-medium">This week</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                </GlassCard>
              </div>

              {/* Search Toolbar */}
              <SearchToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search receiving notes..."
                filterValue={filterYear}
                onFilterChange={setFilterYear}
                primaryButton={{
                  label: "New Receiving",
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => setIsNewReceivingModalOpen(true),
                }}
              />

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={filteredData}
                keyField="id"
                onRowClick={(row) => setSelectedReceiving(row)}
                emptyMessage="No receiving notes found"
              />
            </div>
          </ModuleHeader>

          {/* New Receiving Modal */}
          <Modal
            isOpen={isNewReceivingModalOpen}
            onClose={() => setIsNewReceivingModalOpen(false)}
            title="New Receiving Note"
            className="md:max-w-2xl"
          >
            <div className="h-[480px] flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <DateInput
                    label="Receive Date"
                    value={receiveDate}
                    onChange={setReceiveDate}
                  />
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">PO Number</label>
                    <input type="text" placeholder="Enter PO number..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>

                <SelectField
                  label="Supplier"
                  value={selectedSupplier}
                  options={suppliers}
                  onChange={setSelectedSupplier}
                  onOptionsChange={setSuppliers}
                  allowManage={true}
                  placeholder="Select supplier..."
                />

                {/* Items List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Items Received</label>
                    <button className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Material</th>
                          <th className="px-3 py-2 w-20 text-center">Qty</th>
                          <th className="px-3 py-2 w-24">Unit</th>
                          <th className="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2">
                            <select className="w-full bg-transparent text-sm text-slate-700 focus:outline-none">
                              <option>Select Material...</option>
                              <option>Aluminum Sheet Grade 1000</option>
                              <option>Steel Rod 10mm</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input type="number" defaultValue={1} className="w-full text-center bg-slate-50 rounded border border-slate-200 py-1 text-sm" />
                          </td>
                          <td className="p-2 text-slate-500 text-xs">Sheet</td>
                          <td className="p-2 text-center text-slate-400 hover:text-red-500 cursor-pointer">×</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="p-2 bg-slate-50 text-center">
                      <p className="text-xs text-slate-400 italic">Add items received</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Notes</label>
                  <textarea className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 resize-none" placeholder="Additional notes..."></textarea>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 mt-auto flex gap-3">
                <button 
                  onClick={() => setIsNewReceivingModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30">
                  Create Note
                </button>
              </div>
            </div>
          </Modal>

          {/* Details Modal */}
          <Modal
            isOpen={!!selectedReceiving}
            onClose={() => setSelectedReceiving(null)}
            title={`Receiving Details: ${selectedReceiving?.id}`}
            className="md:max-w-2xl"
          >
            <div className="h-[480px] flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {/* Header Info */}
                <div className="flex justify-between items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${
                      selectedReceiving?.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                      selectedReceiving?.status === "Verified" ? "bg-blue-50 text-blue-700 border-blue-100" :
                      "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}>
                      {selectedReceiving?.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase mb-1">Date</p>
                    <p className="font-semibold text-slate-700">{selectedReceiving ? formatDate(selectedReceiving.date) : ""}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">PO Number</p>
                    <p className="font-medium text-indigo-600">{selectedReceiving?.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Supplier</p>
                    <p className="font-medium text-slate-700">{selectedReceiving?.supplier}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Received By</p>
                  <p className="font-medium text-slate-700">{selectedReceiving?.receivedBy}</p>
                </div>

                {/* Mock Items List */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Items Received</h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2">Item</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                          <th className="px-4 py-2">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[1, 2, 3].map((i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-slate-700">Material Item #{i}</td>
                            <td className="px-4 py-2 text-right font-medium">{i * 10}</td>
                            <td className="px-4 py-2 text-slate-500 text-xs">Pcs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 mt-auto flex gap-3">
                {selectedReceiving?.status === "Pending" && (
                  <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30">
                    Verify Items
                  </button>
                )}
                {selectedReceiving?.status === "Verified" && (
                  <button className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/30">
                    Complete Receiving
                  </button>
                )}
                {selectedReceiving?.status === "Completed" && (
                  <button className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">
                    Print / Export
                  </button>
                )}
              </div>
            </div>
          </Modal>
        </div>
      </section>
    </div>
  );
}
