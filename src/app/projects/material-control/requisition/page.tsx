"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Modal } from "@/components/shared/Modal";
import { SearchToolbar } from "@/components/shared/SearchToolbar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { DateInput } from "@/components/shared/DateInput";
import { SelectField } from "@/components/shared/SelectField";
import { Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

// Types
interface Requisition {
  id: string;
  date: string;
  requester: string;
  department: string;
  items: number;
  priority: "High" | "Normal";
  status: "Pending" | "Approved" | "Completed" | "Rejected";
}

export default function RequisitionPage() {
  // Mock Data
  const [requisitions] = useState<Requisition[]>([
    { id: "REQ-2026-001", date: "2026-01-30", requester: "John Doe", department: "Production", items: 3, priority: "High", status: "Pending" },
    { id: "REQ-2026-002", date: "2026-01-28", requester: "Jane Smith", department: "Maintenance", items: 1, priority: "Normal", status: "Approved" },
    { id: "REQ-2026-003", date: "2026-01-25", requester: "Mike Johnson", department: "Assembly", items: 5, priority: "Normal", status: "Completed" },
    { id: "REQ-2026-004", date: "2026-01-20", requester: "Sarah Wilson", department: "Logistics", items: 2, priority: "High", status: "Rejected" },
    { id: "REQ-2025-015", date: "2025-12-15", requester: "Tom Brown", department: "Production", items: 4, priority: "Normal", status: "Completed" },
    { id: "REQ-2025-014", date: "2025-11-28", requester: "Lisa Chen", department: "QC", items: 2, priority: "High", status: "Completed" },
    { id: "REQ-2025-013", date: "2025-10-10", requester: "James Lee", department: "Maintenance", items: 6, priority: "Normal", status: "Completed" },
    { id: "REQ-2025-012", date: "2025-08-05", requester: "Emma Davis", department: "Assembly", items: 3, priority: "High", status: "Completed" },
  ]);

  // State
  const [searchValue, setSearchValue] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [isNewReqModalOpen, setIsNewReqModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);

  // Form State for New Requisition
  const [requiredDate, setRequiredDate] = useState("");
  const [departments, setDepartments] = useState(["Production", "Maintenance", "Logistics", "Assembly"]);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Table Columns
  const columns: Column<Requisition>[] = [
    { key: "id", header: "Req ID" },
    { key: "date", header: "Date", type: "date" },
    { key: "requester", header: "Requester" },
    { 
      key: "department", 
      header: "Department", 
      align: "center",
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {val}
        </span>
      )
    },
    { key: "items", header: "Items", align: "center" },
    { 
      key: "priority", 
      header: "Priority", 
      align: "center",
      render: (val) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          val === "High" ? "bg-red-50 text-red-700 border border-red-100" : "bg-blue-50 text-blue-700 border border-blue-100"
        }`}>
          {val}
        </span>
      )
    },
    { 
      key: "status", 
      header: "Status", 
      align: "center",
      render: (val) => {
        const styles: Record<string, string> = {
          Pending: "bg-amber-50 text-amber-700 border-amber-100",
          Approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
          Completed: "bg-slate-50 text-slate-600 border-slate-200",
          Rejected: "bg-rose-50 text-rose-700 border-rose-100",
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[val] || ""}`}>
            {val}
          </span>
        );
      }
    },
  ];

  // Filter data by year
  const filteredData = requisitions.filter((req) => {
    const matchesSearch = 
      req.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      req.requester.toLowerCase().includes(searchValue.toLowerCase());
    const matchesYear = filterYear === "All" || req.date.startsWith(filterYear);
    return matchesSearch && matchesYear;
  });

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <ModuleHeader
            title="Material Requisition"
            description="Manage material requests and approvals."
          >
            <div className="space-y-6 mt-8">
              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Pending Approval</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">5</h3>
                    <p className="text-xs text-amber-500 mt-1 font-medium">Action required</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Approved Today</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">12</h3>
                    <p className="text-xs text-emerald-600 mt-1 font-medium">Items released</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Urgent Requests</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">2</h3>
                    <p className="text-xs text-red-500 mt-1 font-medium">High priority</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
                  </div>
                </GlassCard>
              </div>

              {/* Search Toolbar */}
              <SearchToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search requisitions..."
                filterValue={filterYear}
                onFilterChange={setFilterYear}
                primaryButton={{
                  label: "New Requisition",
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => setIsNewReqModalOpen(true),
                }}
              />

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={filteredData}
                keyField="id"
                onRowClick={(row) => setSelectedReq(row)}
                emptyMessage="No requisitions found"
              />
            </div>
          </ModuleHeader>

          {/* New Requisition Modal */}
          <Modal
            isOpen={isNewReqModalOpen}
            onClose={() => setIsNewReqModalOpen(false)}
            title="New Requisition"
            className="md:max-w-2xl"
          >
            <div className="h-[480px] flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {/* Requester Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Requester</label>
                    <input type="text" defaultValue="Admin User" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700" disabled />
                  </div>
                  <SelectField
                    label="Department"
                    value={selectedDepartment}
                    options={departments}
                    onChange={setSelectedDepartment}
                    onOptionsChange={setDepartments}
                    allowManage={true}
                    placeholder="Select department..."
                  />
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-2 gap-4">
                  <DateInput
                    label="Required Date"
                    value={requiredDate}
                    onChange={setRequiredDate}
                  />
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Priority</label>
                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="radio" name="priority" className="text-indigo-600 focus:ring-indigo-500" defaultChecked />
                        Normal
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="radio" name="priority" className="text-red-600 focus:ring-red-500" />
                        <span className="text-red-600 font-medium">Urgent</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Items to Request</label>
                    <button className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Item</th>
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
                      <p className="text-xs text-slate-400 italic">Add items to request</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Reason / Remarks</label>
                  <textarea className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 resize-none" placeholder="Explain why these items are needed..."></textarea>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 mt-auto flex gap-3">
                <button 
                  onClick={() => setIsNewReqModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30">
                  Submit Request
                </button>
              </div>
            </div>
          </Modal>

          {/* Details Modal */}
          <Modal
            isOpen={!!selectedReq}
            onClose={() => setSelectedReq(null)}
            title={`Requisition Details: ${selectedReq?.id}`}
            className="md:max-w-2xl"
          >
            <div className="h-[480px] flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {/* Header Info */}
                <div className="flex justify-between items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${
                      selectedReq?.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                      selectedReq?.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      selectedReq?.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-100" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {selectedReq?.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase mb-1">Date</p>
                    <p className="font-semibold text-slate-700">{selectedReq ? formatDate(selectedReq.date) : ""}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Requester</p>
                    <p className="font-medium text-slate-700">{selectedReq?.requester}</p>
                    <p className="text-xs text-slate-500">{selectedReq?.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Priority</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedReq?.priority === "High" ? "bg-red-50 text-red-700 border border-red-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}>
                      {selectedReq?.priority}
                    </span>
                  </div>
                </div>

                {/* Mock Items List */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Requested Items</h4>
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
                        {[1, 2].map((i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-slate-700">Detailed Spec Material #{i}</td>
                            <td className="px-4 py-2 text-right font-medium">10</td>
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
                {selectedReq?.status === "Pending" && (
                  <>
                    <button className="flex-1 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-lg font-medium transition-colors">
                      Reject
                    </button>
                    <button className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/30">
                      Approve Request
                    </button>
                  </>
                )}
                {selectedReq?.status !== "Pending" && (
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
