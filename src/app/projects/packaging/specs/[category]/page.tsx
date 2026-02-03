"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Boxes,
  Zap,
  Info,
  History as HistoryIcon,
  Upload,
  Download,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { SearchToolbar } from "@/components/shared/SearchToolbar";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { cn } from "@/lib/utils";
import { PackagingService, PackagingProductDTO } from "@/lib/firebase/services/packaging.service";
import { generatePackagingSpecPDF } from "@/lib/utils/pdfGenerator";

// Types
interface PackingRule {
  layers: number | 'n' | 'w'; // 'n' = N/A, 'w' = Warp
  perLayer: number | string; // Keep string to allow formatted numbers like "2.5" if needed, though mostly int
  totalQty: number | string;
}

export interface PackagingProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  width: number;
  length: number;
  height: number;
  nw: number; // Net Weight
  gw: number; // Gross Weight
  cbm: number;
  productType: 'Carton' | 'Carton Case' | 'Wooden Case';
  unit?: string;
  stackingLimit: number;
  sideBoxWeight: string;
  lastUpdated: string;
  
  // Packing Rules for different containers
  packingRules: {
    boxes: Record<string, PackingRule>; // size e.g. "42x46x68"
    pallets: Record<string, PackingRule>; // type e.g. "80x120x65"
    rtn: PackingRule;
    warp: boolean;
  };
}

// Helper Component for Packing Standards
const PackingCard = ({ title, layers, perLayer, totalQty, className }: { title: string, layers: number | string, perLayer: number | string, totalQty: number | string, className?: string }) => (
  <div className={cn("bg-white/50 backdrop-blur-md border border-white/40 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all", className)}>
    <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100/50 flex justify-center items-center">
      <span className="text-xs font-black text-slate-600 uppercase tracking-wider">{title}</span>
    </div>
    <div className="p-4 grid grid-cols-2 gap-4 text-center">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Layers</p>
        <p className="text-xl font-black text-slate-700">{layers}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Per Layer</p>
        <p className="text-xl font-black text-slate-700">{perLayer}</p>
      </div>
    </div>
    <div className="bg-indigo-50/50 px-4 py-3 border-t border-indigo-100 flex justify-between items-center">
      <span className="text-[10px] font-bold text-indigo-400 uppercase">Total Qty</span>
      <span className="text-lg font-black text-indigo-600">{totalQty}</span>
    </div>
  </div>
);

// Helper to calculate volume from dimension string "WxLxH"
const getVolume = (dimStr: string) => {
  const dims = dimStr.split('x').map(d => parseFloat(d));
  if (dims.length !== 3 || dims.some(isNaN)) return 0;
  return dims[0] * dims[1] * dims[2];
};

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = params.category as string;
  
  const [selectedItem, setSelectedItem] = useState<PackagingProduct | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState(new Date().getFullYear().toString());
  const [importProgress, setImportProgress] = useState<{status: 'idle' | 'uploading' | 'parsing' | 'complete', percent: number}>({status: 'idle', percent: 0});
  const [products, setProducts] = useState<PackagingProduct[]>([]);
  const [importStats, setImportStats] = useState({ success: 0, updated: 0 }); // Track real stats
  
  // New: Dimension Filters
  const [filters, setFilters] = useState({
    length: '',
    width: '',
    height: ''
  });
  
  // Add/Edit/Success Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Auto-close Success Modal
  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => setIsSuccessModalOpen(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);

  const [newItem, setNewItem] = useState<Partial<PackagingProductDTO>>({
    sku: '', name: '', width: 0, length: 0, height: 0, nw: 0, gw: 0, productType: 'Carton', stackingLimit: 0, sideBoxWeight: ''
  });

  // Fetch Data from Firestore
  useEffect(() => {
    const loadData = async () => {
      const items = await PackagingService.getByCategory("Inverters"); 
      setProducts(items as PackagingProduct[]);
    };
    loadData();
  }, [categoryId, importProgress.status, isAddModalOpen]); // Reload on Add complete

  // ... parseCSV ...

  // Filter Logic
  const filteredData = products.filter(item => {
    const matchesSearch = 
      item.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.name.toLowerCase().includes(searchValue.toLowerCase());
    
    // Dimension Filters (String matching)
    // removed weight filter
    const matchesLength = !filters.length || String(item.length).includes(filters.length);
    const matchesWidth  = !filters.width  || String(item.width).includes(filters.width);
    const matchesHeight = !filters.height || String(item.height).includes(filters.height);

    return matchesSearch && matchesLength && matchesWidth && matchesHeight;
  });

  const categoryTitle = categoryId ? (categoryId.charAt(0).toUpperCase() + categoryId.slice(1)) : 'Product';

  // Export CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    // Headers
    const headers = [
      "SKU (Item)", "Name", "Category", 
      "Width (cm)", "Length (cm)", "Height (cm)", 
      "Net Weight (kg)", "Gross Weight (kg)", "CBM",
      "Product Type", "Stacking Limit", "Side Box Weight"
    ];

    // Rows
    const rows = filteredData.map(item => [
      item.sku, item.name, item.category,
      item.width, item.length, item.height,
      item.nw, item.gw, item.cbm,
      item.productType, item.stackingLimit, item.sideBoxWeight
    ].map(v => `"${v || ''}"`).join(",")); // Quote values

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    link.setAttribute("download", `packaging_export_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Add Item Submit
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.sku) return;

    // Construct full DTO
    const product: PackagingProductDTO = {
      sku: newItem.sku!,
      name: newItem.name || `${categoryId || 'Inverters'}-${newItem.sku}`,
      category: categoryId ? (categoryId.charAt(0).toUpperCase() + categoryId.slice(1)) : 'Inverters',
      width: Number(newItem.width) || 0,
      length: Number(newItem.length) || 0,
      height: Number(newItem.height) || 0,
      nw: Number(newItem.nw) || 0,
      gw: Number(newItem.gw) || 0,
      cbm: Number(((Number(newItem.width) * Number(newItem.length) * Number(newItem.height)) / 1000000).toFixed(3)),
      productType: (newItem.productType || 'Carton') as 'Carton' | 'Carton Case' | 'Wooden Case',
      stackingLimit: isEditing && selectedItem ? selectedItem.stackingLimit : 0,
      sideBoxWeight: isEditing && selectedItem ? selectedItem.sideBoxWeight : '',
      lastUpdated: new Date().toISOString().split('T')[0],
      packingRules: isEditing && selectedItem ? selectedItem.packingRules : {
          boxes: {},
          pallets: {},
          rtn: { layers: 0, perLayer: 0, totalQty: 0 },
          warp: false
      }
    };

    await PackagingService.importItems([product]); 
    
    // Refresh selected item if editing
    if (isEditing && selectedItem?.sku === product.sku) {
       setSelectedItem(product as PackagingProduct);
    }

    // Close form and show success modal immediately
    setIsAddModalOpen(false);
    setIsSuccessModalOpen(true);
    
    // Reset form state after a brief delay
    setTimeout(() => {
      setIsEditing(false);
      setNewItem({ sku: '', name: '', width: 0, length: 0, height: 0, nw: 0, gw: 0, productType: 'Carton', stackingLimit: 0, sideBoxWeight: '' });
    }, 100);
  };

  // ... handleFileUpload ...
  // Helper: Parse CSV
  const parseCSV = (text: string): PackagingProductDTO[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')); 
    
    // Key Mapping (CSV Header -> DTO Key)
    const keyMap: Record<string, string> = {
       "SKU (Item)": "sku", "Name": "name", "Category": "category",
       "Width (cm)": "width", "Length (cm)": "length", "Height (cm)": "height",
       "Net Weight (kg)": "nw", "Gross Weight (kg)": "gw", "CBM": "cbm",
       "Product Type": "productType", "Stacking Limit": "stackingLimit", "Side Box Weight": "sideBoxWeight"
    };

    const results: PackagingProductDTO[] = [];

    for (let i = 1; i < lines.length; i++) {
       if (!lines[i].trim()) continue;
       
       const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, '')); 
       const row: Record<string, string | number> = {};
       
       headers.forEach((h, idx) => {
         const val = values[idx] || '';
         if (keyMap[h]) {
            if (['width', 'length', 'height'].includes(keyMap[h])) {
               row[keyMap[h]] = parseFloat(val) ? Number(parseFloat(val).toFixed(2)) : 0;
            } else if (['nw', 'gw'].includes(keyMap[h])) {
               row[keyMap[h]] = parseFloat(val) ? Number(parseFloat(val).toFixed(3)) : 0;
            } else if (['cbm', 'stackingLimit'].includes(keyMap[h])) {
                row[keyMap[h]] = parseFloat(val) || 0;
            } else {
                row[keyMap[h]] = val;
            }
         }
         row[h] = val;
       });

       if (!row.name && row.sku) {
          row.name = `${row.category || 'Product'}-${row.sku}`;
       }
       
       if (!row.sku) continue; 

       const packingRules = {
          boxes: {} as Record<string, PackingRule>,
          pallets: {} as Record<string, PackingRule>,
          rtn: { layers: 0, perLayer: 0, totalQty: 0 } as PackingRule,
          warp: false
       };

       ['42x46x68', '47x66x68', '57x64x84', '68x74x86', '70x100x90'].forEach(size => {
          if (row[`Box_${size}_Total`]) {
             packingRules.boxes[size] = {
                layers: Number(row[`Box_${size}_Layers`]) || 0,
                perLayer: Number(row[`Box_${size}_PerLayer`]) || 0,
                totalQty: Number(row[`Box_${size}_Total`]) || 0
             };
          }
       });

       ['80x120x65', '80x120x90', '80x120x115', '110x110x65', '110x110x90', '110x110x115'].forEach(type => {
           if (row[`Pallet_${type}_Total`]) {
              packingRules.pallets[type] = {
                 layers: Number(row[`Pallet_${type}_Layers`]) || 0,
                 perLayer: Number(row[`Pallet_${type}_PerLayer`]) || 0,
                 totalQty: Number(row[`Pallet_${type}_Total`]) || 0
              };
           }
       });

       if (row['RTN_Total']) {
          packingRules.rtn = {
             layers: Number(row['RTN_Layers']) || 0,
             perLayer: Number(row['RTN_PerLayer']) || 0,
             totalQty: Number(row['RTN_Total']) || 0
          };
       }

       packingRules.warp = row['Warp_Required'] === 'TRUE';

       results.push({
          sku: String(row.sku),
          name: String(row.name),
          category: String(row.category) || 'Inverters',
          width: Number(row.width), length: Number(row.length), height: Number(row.height),
          nw: Number(row.nw), gw: Number(row.gw), cbm: Number(row.cbm),
          productType: (String(row.productType) || 'Carton') as 'Carton' | 'Carton Case' | 'Wooden Case',
          stackingLimit: Number(row.stackingLimit),
          sideBoxWeight: String(row.sideBoxWeight),
          lastUpdated: new Date().toISOString().split('T')[0],
          packingRules
       });
    }
    return results;
  };


  // Updated Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onloadstart = () => {
       setImportProgress({status: 'uploading', percent: 10});
    };

    reader.onprogress = (event) => {
       if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 40) + 10; 
          setImportProgress(prev => ({...prev, percent}));
       }
    };

    reader.onload = async (event) => {
       const text = event.target?.result as string;
       setImportProgress({status: 'parsing', percent: 60});
       
       const items = parseCSV(text);
       setImportProgress({status: 'parsing', percent: 80});

       const result = await PackagingService.importItems(items);
       
       setImportStats({
          success: result.successCount,
          updated: 0 
       });

       setImportProgress({status: 'complete', percent: 100});
    };

    reader.readAsText(file);
  };
   
  // Table Columns
  const columns: Column<PackagingProduct>[] = [
    { 
      key: "sku", 
      header: "Item / SKU",
      render: (val) => (
        <div className="flex items-center gap-3 whitespace-nowrap">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Zap className="w-4 h-4" />
          </div>
          <div className="font-bold text-slate-800">{val}</div>
        </div>
      )
    },


    { 
      key: "dimensions", 
      header: "W x L x H (cm)", 
      align: "center",
      render: (_, row) => (
        <span className="font-medium text-slate-600 whitespace-nowrap">
          {row.width} x {row.length} x {row.height}
        </span>
      )
    },
    { 
      key: "nw", 
      header: "Net Weight (kg)", 
      align: "center",
      render: (val) => <span className="font-bold text-slate-700">{val}</span>
    },
    { 
      key: "gw", 
      header: "Gross Weight (kg)", 
      align: "center",
      render: (val) => <span className="font-bold text-slate-700">{val}</span>
    },
    { key: "cbm", header: "CBM", align: "center", className: "font-bold text-indigo-600" },
    { key: "productType", header: "Product Type", align: "center", render: (val) => (
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
          val === "Carton" ? "bg-blue-50 text-blue-600" :
          val === "Carton Case" ? "bg-purple-50 text-purple-600" :
          "bg-amber-50 text-amber-600" 
        )}>
          {val}
        </span>
      )
    },
    { key: "stackingLimit", header: "Stack Limit", align: "center", className: "font-semibold" },

    { key: "lastUpdated", header: "Last Update", align: "center", type: "date", className: "whitespace-nowrap" },
  ];


  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          
          <ModuleHeader
            title={`${categoryTitle} Specs`}
            description={`Manage physical dimensions and packing standards for ${categoryTitle}.`}
            backHref="/projects/packaging/specs"
            backLabel="Data Specifications"
          >
            <div className="space-y-6 mt-12">
              <div className="sticky top-24 z-30 -mx-4 px-4 py-2">
                <SearchToolbar
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  searchPlaceholder={`Search ${categoryId}...`}
                  filterValue={filterValue}
                  onFilterChange={setFilterValue}
                  primaryButton={{
                    label: <span className="hidden sm:inline">Import</span>,
                    icon: <Upload className="w-4 h-4" />,
                    onClick: () => setIsImportModalOpen(true),
                  }}
                  actions={
                    <>
                      <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md shadow-indigo-500/20 flex items-center gap-2"
                        title="Export CSV"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                      </button>

                      <button
                        onClick={() => {
                           setIsEditing(false);
                           setNewItem({ sku: '', name: '', width: 0, length: 0, height: 0, nw: 0, gw: 0, productType: 'Carton' });
                           setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md shadow-indigo-500/20 flex items-center gap-2"
                        title="Add New Item"
                      >
                        <Zap className="w-4 h-4" />
                        <span className="hidden sm:inline">Add New</span>
                      </button>
                    </>
                  }
                >
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <input 
                      placeholder="W" 
                      value={filters.width}
                      onChange={e => setFilters({...filters, width: e.target.value})}
                      className="w-16 px-3 py-2 rounded-lg bg-white/50 border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 placeholder-slate-400"
                    />
                    <input 
                      placeholder="L" 
                      value={filters.length}
                      onChange={e => setFilters({...filters, length: e.target.value})}
                      className="w-16 px-3 py-2 rounded-lg bg-white/50 border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 placeholder-slate-400"
                    />
                    <input 
                      placeholder="H" 
                      value={filters.height}
                      onChange={e => setFilters({...filters, height: e.target.value})}
                      className="w-16 px-3 py-2 rounded-lg bg-white/50 border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 placeholder-slate-400"
                    />
                  </div>
                </SearchToolbar>
              </div>

              <DataTable
                columns={columns}
                data={filteredData}
                keyField="id"
                onRowClick={(row) => {
                  setSelectedItem(row);
                  setActiveTab("overview");
                }}
                emptyMessage="No products found in this category."
              />

              <div className="mt-6 flex justify-center">
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-white/40 px-4 py-1.5 rounded-full border border-white/40 backdrop-blur-sm">
                  Showing {filteredData.length} of {products.length} items (Total in DB)
                </p>
              </div>
            </div>
          </ModuleHeader>

        </div>
      </section>

      {/* Add Item Modal */}
      <Modal
         isOpen={isAddModalOpen}
         onClose={() => setIsAddModalOpen(false)}
         title={isEditing ? "Edit Item Specifications" : "Add New Item"}
         className="max-w-lg"
      >
        <form onSubmit={handleAddItemSubmit} className="space-y-6">
            <div className="space-y-4">
               {/* Row 1: SKU & Name */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">SKU / Item Code <span className="text-red-500">*</span></label>
                     <input 
                        required
                        value={newItem.sku}
                        onChange={e => setNewItem({...newItem, sku: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g. INV-001"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Product Name</label>
                     <input 
                        value={newItem.name}
                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g. Inverter Model X"
                     />
                  </div>
               </div>

               {/* Row 2: Dimensions */}
               <div className="grid grid-cols-3 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Width (cm)</label>
                     <input type="number" step="0.01"
                        value={newItem.width}
                        onChange={e => setNewItem({...newItem, width: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Length (cm)</label>
                     <input type="number" step="0.01"
                        value={newItem.length}
                        onChange={e => setNewItem({...newItem, length: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Height (cm)</label>
                     <input type="number" step="0.01"
                        value={newItem.height}
                        onChange={e => setNewItem({...newItem, height: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     />
                  </div>
               </div>

               {/* Row 3: Weights */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Net Weight (kg)</label>
                     <input type="number" step="0.001"
                        value={newItem.nw}
                        onChange={e => setNewItem({...newItem, nw: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Gross Weight (kg)</label>
                     <input type="number" step="0.001"
                        value={newItem.gw}
                        onChange={e => setNewItem({...newItem, gw: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     />
                  </div>
               </div>

               {/* Row 4: Type, Stack, Side Box */}
               <div className="grid grid-cols-3 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Product Type</label>
                     <select 
                        value={newItem.productType}
                        onChange={e => setNewItem({...newItem, productType: e.target.value as 'Carton' | 'Carton Case' | 'Wooden Case'})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     >
                        <option value="Carton">Carton</option>
                        <option value="Carton Case">Carton Case</option>
                        <option value="Wooden Case">Wooden Case</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Stack Limit</label>
                     <input type="number"
                        value={newItem.stackingLimit}
                        onChange={e => setNewItem({...newItem, stackingLimit: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g. 5"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Side Box Weight</label>
                     <input 
                        value={newItem.sideBoxWeight}
                        onChange={e => setNewItem({...newItem, sideBoxWeight: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g. Max 15kg"
                     />
                  </div>
               </div>
            </div>

            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/30">
              {isEditing ? "Update Item" : "Create Item"}
           </button>
        </form>
      </Modal>

            {/* Success Notification Modal - Minimalist & Fast */}
      <Modal
         isOpen={isSuccessModalOpen}
         onClose={() => setIsSuccessModalOpen(false)}
         title=""
         className="max-w-[280px] text-center !bg-transparent !border-none !shadow-none"
         hideHeader
      >
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 leading-tight tracking-tight">
              {isEditing ? "Updated!" : "Created!"}
            </h3>
            <p className="text-slate-500 text-sm font-bold opacity-70">
              Database Sync OK
            </p>
          </div>

        </div>
      </Modal>

      {/* Item Details Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Inventory Specifications & Packing Rules"
        className="md:max-w-4xl" // Increased width for the complex grid
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-200 -mx-6 -mt-6 mb-6">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'overview' 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Info className="w-4 h-4" /> Dimension & Basic Info
              </button>
              <button 
                onClick={() => setActiveTab("history")}
                className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'history' 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Boxes className="w-4 h-4" /> Packing Standards
              </button>
            </div>

            <div className="min-h-[500px]">
              {activeTab === "overview" ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Product Header */}
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 flex items-center gap-6 shadow-md">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                      <Zap className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">{selectedItem.name}</p>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedItem.sku}</h3>
                      <div className="flex gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <HistoryIcon className="w-3.5 h-3.5" /> Updated: {selectedItem.lastUpdated}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dimension Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Physical Specs</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">WxLxH</span>
                          <span className="text-lg font-black text-slate-800">{selectedItem.width}x{selectedItem.length}x{selectedItem.height} <small className="text-[10px] font-medium text-slate-400">cm</small></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">CBM</span>
                          <span className="text-lg font-black text-indigo-600">{selectedItem.cbm}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Weight Data</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">NW</span>
                          <span className="text-lg font-black text-slate-800">{selectedItem.nw} <small className="text-[10px] font-medium text-slate-400">kg</small></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">GW</span>
                          <span className="text-lg font-black text-slate-800">{selectedItem.gw} <small className="text-[10px] font-medium text-slate-400">kg</small></span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Handling</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">Product Type</span>
                          <span className="text-lg font-black text-slate-800">{selectedItem.productType}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">Stack Limit</span>
                          <span className="text-lg font-black text-orange-600">{selectedItem.stackingLimit} <small className="text-[10px] font-medium text-slate-400">Layers</small></span>
                        </div>
                      </div>
                    </div>

                    {/* Side Notes */}
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <Info className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-black text-amber-800 uppercase tracking-wide">Side Box Weight</h4>
                        <p className="text-sm text-amber-700 font-medium">{selectedItem.sideBoxWeight || "No special handling notes recorded for this item's side packaging."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Standard Boxes */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
                      <Boxes className="w-4 h-4 text-indigo-500" /> Standard Boxes
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {Object.entries(selectedItem.packingRules.boxes)
                        .sort((a, b) => getVolume(a[0]) - getVolume(b[0]))
                        .map(([size, rule]) => (
                        <PackingCard 
                          key={size}
                          title={size}
                          layers={rule.layers}
                          perLayer={rule.perLayer}
                          totalQty={rule.totalQty}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pallet Configuration */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
                      <div className="w-4 h-4 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      </div>
                      Pallet Configuration
                    </h4>
                    {/* 80x120 Series */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {Object.entries(selectedItem.packingRules.pallets)
                        .filter(([type]) => type.includes('80x120'))
                        .sort((a, b) => {
                           const getH = (s: string) => parseInt(s.split('x')[2] || '0');
                           return getH(a[0]) - getH(b[0]);
                        })
                        .map(([type, rule]) => (
                        <PackingCard 
                          key={type}
                          title={type}
                          layers={rule.layers}
                          perLayer={rule.perLayer}
                          totalQty={rule.totalQty}
                          className="border-emerald-100/50"
                        />
                      ))}
                    </div>

                    {/* 110x110 Series */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(selectedItem.packingRules.pallets)
                        .filter(([type]) => type.includes('110x110'))
                        .sort((a, b) => {
                           const getH = (s: string) => parseInt(s.split('x')[2] || '0');
                           return getH(a[0]) - getH(b[0]);
                        })
                        .map(([type, rule]) => (
                        <PackingCard 
                          key={type}
                          title={type}
                          layers={rule.layers}
                          perLayer={rule.perLayer}
                          totalQty={rule.totalQty}
                          className="border-emerald-100/50"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Special Packaging (RTN & Warp) */}
                  <div>
                     <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
                      <HistoryIcon className="w-4 h-4 text-amber-500" /> Special Packaging
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {/* RTN */}
                       {selectedItem.packingRules.rtn && Number(selectedItem.packingRules.rtn.totalQty) > 0 && (
                          <PackingCard 
                             title="RTN (Returnable)"
                             layers={selectedItem.packingRules.rtn.layers}
                             perLayer={selectedItem.packingRules.rtn.perLayer}
                             totalQty={selectedItem.packingRules.rtn.totalQty}
                             className="border-amber-200 ring-2 ring-amber-50"
                          />
                       )}
                       
                       {/* Warp */}
                       <div className="bg-white/50 backdrop-blur-md border border-white/40 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all flex flex-col">
                          <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100/50 flex justify-center">
                             <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Warp Packaging</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-2">
                             <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", 
                                selectedItem.packingRules.warp ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                             )}>
                                <CheckCircle2 className="w-6 h-6" />
                             </div>
                             <p className={cn("text-sm font-bold uppercase tracking-tight", 
                                selectedItem.packingRules.warp ? "text-emerald-600" : "text-orange-600"
                             )}>
                                {selectedItem.packingRules.warp ? "Required" : "Not Required"}
                             </p>
                          </div>
                       </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => selectedItem && generatePackagingSpecPDF(selectedItem as PackagingProduct)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all uppercase tracking-widest hover:shadow-md flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF Spec
              </button>
              <button 
                onClick={() => {
                  if (selectedItem) {
                    setNewItem({
                      sku: selectedItem.sku,
                      name: selectedItem.name,
                      category: selectedItem.category,
                      width: selectedItem.width,
                      length: selectedItem.length,
                      height: selectedItem.height,
                      nw: selectedItem.nw,
                      gw: selectedItem.gw,
                      productType: selectedItem.productType
                    });
                    setIsEditing(true);
                    setIsAddModalOpen(true);
                  }
                }}
                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest hover:scale-[1.02] active:scale-95"
              >
                Edit Item Specifications
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          if (importProgress.status !== 'uploading' && importProgress.status !== 'parsing') {
            setIsImportModalOpen(false);
            setImportProgress({status: 'idle', percent: 0});
          }
        }}
        title="Import Packaging Specifications"
        className="md:max-w-2xl"
      >
        <div className="space-y-8 p-2">
          {importProgress.status === 'idle' ? (
            <div className="space-y-6">
              {/* Info Box */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
                <Info className="w-6 h-6 text-indigo-500 mt-1" />
                <div>
                  <h4 className="text-sm font-black text-indigo-800 uppercase tracking-wide">Import Instructions</h4>
                  <p className="text-xs text-indigo-700 font-medium leading-relaxed mt-1">
                    Please use the official CSV template to ensure all 1,800+ items are mapped correctly to our new W/L/H separate storage structure.
                  </p>
                </div>
              </div>

              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group relative"
              >
                <input 
                  type="file" 
                  accept=".csv,.xlsx" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileUpload}
                />
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Drop your CSV file here</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">or click to browse from your computer</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors uppercase tracking-widest pointer-events-none">
                  Select File
                </div>
              </div>

              {/* Download Template */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-black text-slate-800 tracking-tight">Don&apos;t have the template?</p>
                    <p className="text-[10px] text-slate-500 font-medium">Download the schema-compatible CSV template</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const headers = [
                      "SKU (Item)", "Name", "Category", 
                      "Width (cm)", "Length (cm)", "Height (cm)", 
                      "Net Weight (kg)", "Gross Weight (kg)", "CBM",
                      "Product Type", "Stacking Limit", "Side Box Weight",
                      // Boxes
                      "Box_42x46x68_Layers", "Box_42x46x68_PerLayer", "Box_42x46x68_Total",
                      "Box_47x66x68_Layers", "Box_47x66x68_PerLayer", "Box_47x66x68_Total", 
                      "Box_57x64x84_Layers", "Box_57x64x84_PerLayer", "Box_57x64x84_Total",
                      "Box_68x74x86_Layers", "Box_68x74x86_PerLayer", "Box_68x74x86_Total",
                      "Box_70x100x90_Layers", "Box_70x100x90_PerLayer", "Box_70x100x90_Total",
                      // Pallets
                      "Pallet_80x120x65_Layers", "Pallet_80x120x65_PerLayer", "Pallet_80x120x65_Total",
                      "Pallet_80x120x90_Layers", "Pallet_80x120x90_PerLayer", "Pallet_80x120x90_Total",
                      "Pallet_80x120x115_Layers", "Pallet_80x120x115_PerLayer", "Pallet_80x120x115_Total",
                      "Pallet_110x110x65_Layers", "Pallet_110x110x65_PerLayer", "Pallet_110x110x65_Total",
                      "Pallet_110x110x90_Layers", "Pallet_110x110x90_PerLayer", "Pallet_110x110x90_Total",
                      "Pallet_110x110x115_Layers", "Pallet_110x110x115_PerLayer", "Pallet_110x110x115_Total",
                      // RTN & Warp
                      "RTN_Layers", "RTN_PerLayer", "RTN_Total",
                      "Warp_Required"
                    ];
                    
                    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "packaging_specs_template.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-4 py-2 text-indigo-600 bg-white border border-indigo-100 rounded-xl text-xs font-black hover:bg-indigo-50 transition-colors uppercase tracking-widest"
                >
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {importProgress.status === 'complete' ? (
                <>
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Import Successful!</h3>
                    <p className="text-slate-500 font-medium mt-1">Processed {importStats.success} items.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">New Items</p>
                      <p className="text-2xl font-black text-indigo-600">{importStats.success}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Updated</p>
                      <p className="text-2xl font-black text-slate-800">{importStats.updated || '-'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        setIsImportModalOpen(false);
                        setImportProgress({status: 'idle', percent: 0});
                    }}
                    className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg"
                  >
                    Return to Table
                  </button>
                </>
              ) : (
                <>
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" 
                      style={{ animationDuration: '0.8s' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-slate-800">
                      {importProgress.percent}%
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-widest">
                      {importProgress.status === 'uploading' ? 'Uploading File...' : 'Parsing Specifications...'}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {importProgress.status === 'uploading' 
                        ? 'Transferring data to our secure servers' 
                        : 'Mapping CSV data to smart packing structure'}
                    </p>
                  </div>
                  <div className="max-w-md mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${importProgress.percent}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
