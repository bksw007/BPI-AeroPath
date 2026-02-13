"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Package, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  ArrowLeft 
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { CUSTOMER_PACK_TYPE_MAPPING, PACKAGE_MASTER_DATA, PackageDef } from "@/lib/config/packagingData";

// Types
interface CustomerMapping {
    code: string;
    type: string;
}

export default function PackagingCustomersPage() {
  const router = useRouter();
  // State initialization from config
  const [customers, setCustomers] = useState<CustomerMapping[]>(
      Object.entries(CUSTOMER_PACK_TYPE_MAPPING).map(([code, type]) => ({ code, type }))
  );
  
  const [packages, setPackages] = useState<PackageDef[]>(PACKAGE_MASTER_DATA);

  // Modal States
  const [isCustomerManageOpen, setIsCustomerManageOpen] = useState(false); // New Manager Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false); // Add/Edit specific customer
  const [editingCustomer, setEditingCustomer] = useState<CustomerMapping | null>(null);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageDef | null>(null);

  // Forms
  const [custForm, setCustForm] = useState({ code: "", type: "E" });
  
  const [pkgForm, setPkgForm] = useState<PackageDef>({ 
      name: "", 
      outer: { w: 0, l: 0, h: 0 },
      inner: { w: 0, l: 0, h: 0 },
      m3: 0, 
      types: ["E"],
      category: 'Box'
  });

  // --- Helpers ---
  const getMappedCustomers = (pkgTypes: string[]) => {
      // Find customers whose type is included in this package's allowed types
      return customers.filter(c => pkgTypes.includes(c.type));
  };

  // --- Handlers: Customer ---
  const openCustomerModal = (customer?: CustomerMapping) => {
      if (customer) {
          setEditingCustomer(customer);
          setCustForm({ code: customer.code, type: customer.type });
      } else {
          setEditingCustomer(null);
          setCustForm({ code: "", type: "E" });
      }
      setIsCustomerModalOpen(true);
  };

  const saveCustomer = () => {
      if (!custForm.code) return;
      
      if (editingCustomer) {
          setCustomers(prev => prev.map(c => c.code === editingCustomer.code ? { ...custForm } : c));
      } else {
          setCustomers(prev => [...prev, { ...custForm }]);
      }
      setIsCustomerModalOpen(false);
  };

  const deleteCustomer = (code: string) => {
      if(confirm(`Delete customer ${code}?`)) {
          setCustomers(prev => prev.filter(c => c.code !== code));
          setIsCustomerModalOpen(false);
      }
  }

  // --- Handlers: Package ---
  const openPackageModal = (pkg?: PackageDef) => {
      if (pkg) {
          setEditingPackage(pkg);
          setPkgForm(JSON.parse(JSON.stringify(pkg))); // Deep copy
      } else {
          setEditingPackage(null);
          setPkgForm({ 
              name: "", 
              outer: { w: 0, l: 0, h: 0 },
              inner: { w: 0, l: 0, h: 0 },
              m3: 0, 
              types: ["E"],
              category: 'Box'
          });
      }
      setIsPackageModalOpen(true);
  };

  const savePackage = () => {
      if (!pkgForm.name) return;

      if (editingPackage) {
           setPackages(prev => prev.map(p => p.name === editingPackage.name ? pkgForm : p));
      } else {
           setPackages(prev => [...prev, pkgForm]);
      }
      setIsPackageModalOpen(false);
  };
  
  const deletePackage = (name: string) => {
      if(confirm(`Delete package ${name}?`)) {
          setPackages(prev => prev.filter(p => p.name !== name));
          setIsPackageModalOpen(false);
      }
  }

  const togglePkgType = (t: string) => {
      setPkgForm(prev => {
          const exists = prev.types.includes(t);
          return {
              ...prev,
              types: exists ? prev.types.filter(x => x !== t) : [...prev.types, t]
          };
      });
  };

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12">
        <div className="container-custom">
          
          <div className="relative flex items-center justify-center pt-2 mb-12">
            <button 
              onClick={() => router.back()} 
              className="absolute left-0 inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm md:text-base group"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline font-medium">Smart Packaging</span>
            </button>
            
            <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold flex flex-col items-center leading-tight">
                <span className="bg-clip-text text-transparent bg-linear-to-br from-slate-800 via-slate-600 to-slate-800 bg-size-[200%_100%] animate-shimmer">
                    Package Configuration
                </span>
                </h1>
                <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Manage package dimensions and their allowed customer mappings.
                </p>
            </div>

            {/* Manage Customers Button */}
            <button
                onClick={() => setIsCustomerManageOpen(true)}
                className="absolute right-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-sm group"
            >
                <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Users className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">Manage Customers</span>
            </button>
          </div>

          {/* Unified Package Table */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Package className="w-5 h-5"/>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">Defined Packages</h3>
                </div>
                <button 
                    onClick={() => openPackageModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Package</span>
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Package Name / Outer</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Dimensions (Inner)</th>
                                <th className="px-6 py-4 text-right">M3 Capacity</th>
                                <th className="px-6 py-4">Allowed Types</th>
                                <th className="px-6 py-4">Assigned Customers</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {packages.map((pkg, idx) => {
                                const mappedCustomers = getMappedCustomers(pkg.types);
                                return (
                                    <tr 
                                        key={idx} 
                                        onClick={() => openPackageModal(pkg)}
                                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{pkg.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                Outer: {pkg.outer.w}x{pkg.outer.l}x{pkg.outer.h} cm
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide ${
                                                pkg.category === 'Pallet' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {pkg.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-emerald-600 font-bold">
                                            {pkg.inner.w}x{pkg.inner.l}x{pkg.inner.h} <span className="text-emerald-400">cm</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-600 font-bold">
                                            {pkg.m3}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                {pkg.types.map(t => (
                                                    <span key={t} className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${
                                                        t === 'A' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                        t === 'E' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                        'bg-amber-50 text-amber-600 border border-amber-100'
                                                    }`}>
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex shrink-0 gap-2 max-w-[200px]">
                                                {mappedCustomers.length > 0 ? (
                                                    mappedCustomers.map(c => (
                                                        <span key={c.code} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">
                                                            {c.code}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-300 italic text-xs">None</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
          </GlassCard>

        </div>
      </section>

      {/* --- MODALS --- */}

      {/* Customer Management Hub Modal */}
      {isCustomerManageOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <Users className="w-5 h-5"/>
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-slate-900">Manage Customers</h3>
                              <p className="text-sm text-slate-500">Add or edit customer codes and their region types.</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setIsCustomerManageOpen(false)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-0">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase sticky top-0">
                              <tr>
                                  <th className="px-6 py-3">Code</th>
                                  <th className="px-6 py-3 text-center">Region Type</th>
                                  <th className="px-6 py-3 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                               {customers.map((c) => (
                                   <tr key={c.code} className="hover:bg-indigo-50/30">
                                       <td className="px-6 py-3 font-bold text-slate-700">{c.code}</td>
                                       <td className="px-6 py-3 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${
                                                c.type === 'A' ? 'bg-blue-50 text-blue-600' :
                                                c.type === 'E' ? 'bg-purple-50 text-purple-600' :
                                                'bg-amber-50 text-amber-600'
                                            }`}>
                                                {c.type}
                                            </span>
                                       </td>
                                       <td className="px-6 py-3 text-right">
                                           <button 
                                              onClick={() => openCustomerModal(c)}
                                              className="text-indigo-600 font-bold hover:underline text-xs"
                                           >
                                               Edit
                                           </button>
                                       </td>
                                   </tr>
                               ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-4 border-t border-slate-100 text-center">
                      <button 
                          onClick={() => openCustomerModal()}
                          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                      >
                          <Plus className="w-4 h-4" /> Add New Customer
                      </button>
                  </div>
             </div>
          </div>
      )}

      {/* Add/Edit Specific Customer Modal (Nested or independent) */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in zoom-in duration-200">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative border border-white/20">
              <button 
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                  <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                  {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </h3>

              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Customer Code</label>
                      <input 
                          type="text" 
                          value={custForm.code}
                          onChange={e => setCustForm({...custForm, code: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g. FAP"
                          autoFocus
                          disabled={!!editingCustomer} // Disable code edit if updating
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Region Type</label>
                      <div className="flex gap-2">
                          {['A', 'E', 'R'].map(type => (
                              <button
                                  key={type}
                                  onClick={() => setCustForm({...custForm, type})}
                                  className={`flex-1 py-2 rounded-lg font-bold border transition-all ${
                                      custForm.type === type 
                                      ? 'bg-indigo-600 text-white border-indigo-600' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                              >
                                  {type}
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                      {editingCustomer && (
                          <button 
                             onClick={() => deleteCustomer(editingCustomer.code)}
                             className="p-3 text-red-500 hover:bg-red-50 rounded-xl border border-red-100"
                          >
                              <Trash2 className="w-5 h-5" />
                          </button>
                      )}
                      <button 
                          onClick={saveCustomer}
                          className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                      >
                          <Save className="w-4 h-4" /> Save Customer
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Package Modal (Detail / Edit / New) */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button 
                  onClick={() => setIsPackageModalOpen(false)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                  <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center justify-between mb-6 pr-8">
                  <h3 className="text-xl font-bold text-slate-900">
                      {editingPackage ? 'Package Details' : 'New Package'}
                  </h3>
                  {editingPackage && (
                      <div className="flex gap-2">
                           <button 
                              onClick={() => deletePackage(editingPackage.name)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Package"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                      </div>
                  )}
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Package Name</label>
                      <input 
                          type="text" 
                          value={pkgForm.name}
                          onChange={e => setPkgForm({...pkgForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. 110x110x110"
                          disabled={!!editingPackage} // Name is ID, usually immutable or requires special handling. Let's keep it editable only for New for now, or use a separate ID. 
                                                     // Actually user asked to "Edit" form to be usable. If they edit name, it's like a new package or rename.
                                                     // For simplicity in this array-based mock, let's allow editing name but we must handle "rename" logic in save.
                                                     // Wait, savePackage uses `editingPackage.name` to find index. If we change form name, we still have reference.
                                                     // So we can allow editing.
                          // Correction: If we allow editing Name, we need to ensure we don't duplicate keys. For now let's allow it.
                      />
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs font-bold text-slate-500 mb-2 uppercase">Outer Dimensions (cm)</div>
                      <div className="grid grid-cols-3 gap-3">
                          <div>
                             <label className="block text-xs font-bold text-slate-400 mb-1">Width</label>
                             <input type="number" value={pkgForm.outer.w} onChange={e => setPkgForm({ ...pkgForm, outer: { ...pkgForm.outer, w: Number(e.target.value) } })} className="w-full px-2 py-1 border border-slate-200 rounded text-center" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-slate-400 mb-1">Length</label>
                             <input type="number" value={pkgForm.outer.l} onChange={e => setPkgForm({ ...pkgForm, outer: { ...pkgForm.outer, l: Number(e.target.value) } })} className="w-full px-2 py-1 border border-slate-200 rounded text-center" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-slate-400 mb-1">Height</label>
                             <input type="number" value={pkgForm.outer.h} onChange={e => setPkgForm({ ...pkgForm, outer: { ...pkgForm.outer, h: Number(e.target.value) } })} className="w-full px-2 py-1 border border-slate-200 rounded text-center" />
                          </div>
                      </div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <div className="text-xs font-bold text-emerald-600 mb-2 uppercase flex justify-between">
                          <span>Inner Dimensions (cm)</span>
                          <span>Uses for Calcs</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                          <div>
                             <label className="block text-xs font-bold text-emerald-500/70 mb-1">Width</label>
                             <input type="number" value={pkgForm.inner.w} onChange={e => setPkgForm({ ...pkgForm, inner: { ...pkgForm.inner, w: Number(e.target.value) } })} className="w-full px-2 py-1 border border-emerald-200 rounded text-center focus:ring-emerald-500" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-emerald-500/70 mb-1">Length</label>
                             <input type="number" value={pkgForm.inner.l} onChange={e => setPkgForm({ ...pkgForm, inner: { ...pkgForm.inner, l: Number(e.target.value) } })} className="w-full px-2 py-1 border border-emerald-200 rounded text-center focus:ring-emerald-500" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-emerald-500/70 mb-1">Height</label>
                             <input type="number" value={pkgForm.inner.h} onChange={e => setPkgForm({ ...pkgForm, inner: { ...pkgForm.inner, h: Number(e.target.value) } })} className="w-full px-2 py-1 border border-emerald-200 rounded text-center focus:ring-emerald-500" />
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">M3 Capacity</label>
                          <input type="number" step="0.0001" value={pkgForm.m3} onChange={e => setPkgForm({...pkgForm, m3: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                          <select 
                              value={pkgForm.category}
                              onChange={e => setPkgForm({...pkgForm, category: e.target.value as 'Box' | 'Pallet'})}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                              <option value="Box">Box</option>
                              <option value="Pallet">Pallet</option>
                          </select>
                       </div>
                  </div>

                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Allowed Types</label>
                      <div className="flex gap-3">
                          {['A', 'E', 'R'].map(type => (
                               <label key={type} className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                     type="checkbox" 
                                     checked={pkgForm.types.includes(type)}
                                     onChange={() => togglePkgType(type)}
                                     className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" 
                                   />
                                   <span className="font-bold text-slate-600">{type}</span>
                               </label>
                          ))}
                      </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                      <button 
                          onClick={savePackage}
                          className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                      >
                          <Save className="w-4 h-4" /> Save
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
