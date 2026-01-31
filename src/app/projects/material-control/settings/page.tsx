"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Modal } from "@/components/shared/Modal";
import { SearchToolbar } from "@/components/shared/SearchToolbar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SelectField } from "@/components/shared/SelectField";
import { Settings, Users, Tag, MapPin, Building, Plus, Save } from "lucide-react";

// Types
interface MasterDataItem {
  id: string;
  name: string;
  type: string;
  description: string;
  status: "Active" | "Inactive";
  itemCount: number;
}

export default function SettingsPage() {
  // Mock Data
  const [masterData] = useState<MasterDataItem[]>([
    { id: "CAT-001", name: "Metals", type: "Category", description: "All metal materials", status: "Active", itemCount: 245 },
    { id: "CAT-002", name: "Plastics", type: "Category", description: "Polymer and plastic materials", status: "Active", itemCount: 128 },
    { id: "LOC-001", name: "Warehouse A", type: "Location", description: "Main storage facility", status: "Active", itemCount: 892 },
    { id: "LOC-002", name: "Warehouse B", type: "Location", description: "Secondary storage", status: "Active", itemCount: 356 },
    { id: "SUP-001", name: "ABC Metals Co.", type: "Supplier", description: "Primary metal supplier", status: "Active", itemCount: 45 },
    { id: "UNT-001", name: "Sheet", type: "Unit", description: "Sheet measurement unit", status: "Active", itemCount: 120 },
  ]);

  // State
  const [searchValue, setSearchValue] = useState("");
  const [filterYear, setFilterYear] = useState("All");
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MasterDataItem | null>(null);

  // Form State
  const [dataTypes] = useState(["Category", "Location", "Supplier", "Unit", "Department"]);
  const [selectedDataType, setSelectedDataType] = useState("");

  // Table Columns
  const columns: Column<MasterDataItem>[] = [
    { key: "name", header: "Name" },
    { 
      key: "type", 
      header: "Type", 
      align: "center",
      render: (val) => {
        const icons: Record<string, React.ReactNode> = {
          Category: <Tag className="w-3 h-3" />,
          Location: <MapPin className="w-3 h-3" />,
          Supplier: <Building className="w-3 h-3" />,
          Unit: <Settings className="w-3 h-3" />,
        };
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            {icons[val]} {val}
          </span>
        );
      }
    },
    { key: "description", header: "Description" },
    { key: "itemCount", header: "Items", align: "center" },
    { 
      key: "status", 
      header: "Status", 
      align: "center",
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          val === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200"
        }`}>
          {val}
        </span>
      )
    },
  ];

  // Filter Options for Type
  const filterOptions = ["All", ...dataTypes];

  // Filter data
  const filteredData = masterData.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.description.toLowerCase().includes(searchValue.toLowerCase());
    const matchesType = filterYear === "All" || item.type === filterYear;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <ModuleHeader
            title="Settings"
            description="Master data, rules, and module configuration."
          >
            <div className="space-y-6 mt-8">
              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Categories</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">12</h3>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Tag className="w-6 h-6 text-indigo-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Locations</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">8</h3>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Suppliers</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">24</h3>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Building className="w-6 h-6 text-amber-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Users</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">15</h3>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </GlassCard>
              </div>

              {/* Search Toolbar */}
              <SearchToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search master data..."
                filterValue={filterYear}
                onFilterChange={setFilterYear}
                filterOptions={filterOptions}
                primaryButton={{
                  label: "Add New",
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => setIsNewItemModalOpen(true),
                }}
              />

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={filteredData}
                keyField="id"
                onRowClick={(row) => setSelectedItem(row)}
                emptyMessage="No master data found"
              />
            </div>
          </ModuleHeader>

          {/* New Item Modal */}
          <Modal
            isOpen={isNewItemModalOpen}
            onClose={() => setIsNewItemModalOpen(false)}
            title="Add Master Data"
            className="md:max-w-lg"
          >
            <div className="space-y-6">
              <SelectField
                label="Data Type"
                value={selectedDataType}
                options={dataTypes}
                onChange={setSelectedDataType}
                placeholder="Select type..."
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Name</label>
                <input 
                  type="text" 
                  placeholder="Enter name..." 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                <textarea 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 resize-none" 
                  placeholder="Enter description..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </Modal>

          {/* Details Modal */}
          <Modal
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            title={`Edit: ${selectedItem?.name}`}
            className="md:max-w-lg"
          >
            {selectedItem && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                  <p className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">{selectedItem.type}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Name</label>
                  <input 
                    type="text" 
                    defaultValue={selectedItem.name}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 resize-none" 
                    defaultValue={selectedItem.description}
                  ></textarea>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Status</p>
                    <p className="text-xs text-slate-500">Toggle active/inactive</p>
                  </div>
                  <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedItem.status === "Active" ? "bg-emerald-500" : "bg-slate-300"
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedItem.status === "Active" ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-lg font-medium transition-colors">
                    Delete
                  </button>
                  <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </section>
    </div>
  );
}
