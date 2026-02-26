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
    <div className="min-h-screen bg-[#F6EDDE] pt-20">
      <section className="py-12">
        <div className="container-custom">
          
          <div className="relative flex items-center justify-center pt-2 mb-12">
            <button 
              onClick={() => router.back()} 
              className="absolute left-0 inline-flex items-center gap-2 text-[#7E5C4A] hover:text-[#272727] transition-colors text-sm md:text-base group"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline font-medium">Packaging Console</span>
            </button>
            
            <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold flex flex-col items-center leading-tight">
                <span className="text-[#272727]">
                    Package Configuration
                </span>
                </h1>
                <p className="text-[#7E5C4A] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Manage package dimensions and their allowed customer mappings.
                </p>
            </div>

            {/* Manage Customers Button */}
            <button
                onClick={() => setIsCustomerManageOpen(true)}
                className="absolute right-0 flex items-center gap-2 px-4 py-2 bg-[#EFD09E]/55 border border-[#D4AA7D]/35 text-[#7E5C4A] rounded-xl hover:bg-[#EFD09E]/75 hover:border-[#9ACD32]/35 transition-all shadow-sm group"
            >
                <div className="p-1 bg-[#272727]/10 text-[#272727] rounded-lg group-hover:bg-[#9ACD32] group-hover:text-[#272727] transition-colors">
                    <Users className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">Manage Customers</span>
            </button>
          </div>

          {/* Unified Package Table */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-[#9ACD32]/18 text-[#5a7a1a] rounded-lg">
                        <Package className="w-5 h-5"/>
                    </div>
                    <h3 className="font-bold text-[#272727] text-lg">Defined Packages</h3>
                </div>
                <button 
                    onClick={() => openPackageModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#272727] text-[#EFD09E] font-bold rounded-lg hover:bg-[#1f1f1f] transition shadow-lg shadow-[#272727]/25 border border-[#EFD09E]/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Package</span>
                </button>
            </div>

            <div className="bg-[#EFD09E]/60 border border-[#D4AA7D]/35 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#D4AA7D] border-b border-[#7E5C4A]/25 text-xs font-bold text-[#272727] uppercase">
                            <tr>
                                <th className="px-6 py-4">Package Name / Outer</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Dimensions (Inner)</th>
                                <th className="px-6 py-4 text-right">M3 Capacity</th>
                                <th className="px-6 py-4">Allowed Types</th>
                                <th className="px-6 py-4">Assigned Customers</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4AA7D]/35 bg-[#EFD09E]">
                            {packages.map((pkg, idx) => {
                                const mappedCustomers = getMappedCustomers(pkg.types);
                                return (
                                    <tr 
                                        key={idx} 
                                        onClick={() => openPackageModal(pkg)}
                                        className="hover:bg-[#F6EDDE] transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[#272727]">{pkg.name}</div>
                                            <div className="text-xs text-[#7E5C4A] font-mono">
                                                Outer: {pkg.outer.w}x{pkg.outer.l}x{pkg.outer.h} cm
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide ${
                                                pkg.category === 'Pallet' ? 'bg-[#D4AA7D]/35 text-[#7E5C4A]' : 'bg-[#EEF2F6] text-[#7E5C4A]'
                                            }`}>
                                                {pkg.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-[#5a7a1a] font-bold">
                                            {pkg.inner.w}x{pkg.inner.l}x{pkg.inner.h} <span className="text-[#9ACD32]">cm</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-[#5a7a1a] font-bold">
                                            {pkg.m3}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                {pkg.types.map(t => (
                                                    <span key={t} className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${
                                                        t === 'A' ? 'bg-[#9ACD32]/20 text-[#5a7a1a] border border-[#9ACD32]/35' :
                                                        t === 'E' ? 'bg-[#272727]/10 text-[#272727] border border-[#272727]/20' :
                                                        'bg-[#D4AA7D]/30 text-[#7E5C4A] border border-[#D4AA7D]/45'
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
                                                        <span key={c.code} className="px-1.5 py-0.5 bg-[#EEF2F6] text-[#7E5C4A] text-[10px] rounded border border-[#D4AA7D]/35">
                                                            {c.code}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[#7E5C4A]/60 italic text-xs">None</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#272727]/50 backdrop-blur-sm animate-fade-in">
             <div className="bg-[#EEF2F6]/95 border border-white/80 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative">
                  <div className="p-6 border-b border-[#D4AA7D]/25 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#272727]/10 text-[#272727] rounded-lg">
                              <Users className="w-5 h-5"/>
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-[#272727]">Manage Customers</h3>
                              <p className="text-sm text-[#7E5C4A]">Add or edit customer codes and their region types.</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setIsCustomerManageOpen(false)}
                          className="p-2 text-[#7E5C4A] hover:text-[#272727] hover:bg-[#EFD09E]/60 rounded-lg transition"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-0">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-[#D4AA7D] text-xs font-bold text-[#272727] uppercase sticky top-0">
                              <tr>
                                  <th className="px-6 py-3">Code</th>
                                  <th className="px-6 py-3 text-center">Region Type</th>
                                  <th className="px-6 py-3 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-[#D4AA7D]/30">
                               {customers.map((c) => (
                                   <tr key={c.code} className="hover:bg-[#EFD09E]/35">
                                       <td className="px-6 py-3 font-bold text-[#272727]">{c.code}</td>
                                       <td className="px-6 py-3 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${
                                                c.type === 'A' ? 'bg-[#9ACD32]/20 text-[#5a7a1a]' :
                                                c.type === 'E' ? 'bg-[#272727]/10 text-[#272727]' :
                                                'bg-[#D4AA7D]/30 text-[#7E5C4A]'
                                            }`}>
                                                {c.type}
                                            </span>
                                       </td>
                                       <td className="px-6 py-3 text-right">
                                           <button 
                                              onClick={() => openCustomerModal(c)}
                                              className="text-[#7E5C4A] font-bold hover:underline text-xs"
                                           >
                                               Edit
                                           </button>
                                       </td>
                                   </tr>
                               ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-4 border-t border-[#D4AA7D]/25 text-center">
                      <button 
                          onClick={() => openCustomerModal()}
                          className="w-full py-3 bg-[#272727] text-[#EFD09E] font-bold rounded-xl hover:bg-[#1f1f1f] transition shadow-lg shadow-[#272727]/25 border border-[#EFD09E]/20 flex items-center justify-center gap-2"
                      >
                          <Plus className="w-4 h-4" /> Add New Customer
                      </button>
                  </div>
             </div>
          </div>
      )}

      {/* Add/Edit Specific Customer Modal (Nested or independent) */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#272727]/45 backdrop-blur-sm animate-in zoom-in duration-200">
           <div className="bg-[#EEF2F6]/95 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative border border-white/80">
              <button 
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="absolute right-4 top-4 text-[#7E5C4A] hover:text-[#272727]"
              >
                  <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-[#272727] mb-6">
                  {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </h3>

              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-[#7E5C4A] mb-1">Customer Code</label>
                      <input 
                          type="text" 
                          value={custForm.code}
                          onChange={e => setCustForm({...custForm, code: e.target.value})}
                          className="w-full px-3 py-2 border border-[#D4AA7D]/40 bg-[#EFD09E]/45 rounded-xl text-[#272727] outline-none focus:ring-2 focus:ring-[#9ACD32]/30"
                          placeholder="e.g. FAP"
                          autoFocus
                          disabled={!!editingCustomer} // Disable code edit if updating
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-[#7E5C4A] mb-1">Region Type</label>
                      <div className="flex gap-2">
                          {['A', 'E', 'R'].map(type => (
                              <button
                                  key={type}
                                  onClick={() => setCustForm({...custForm, type})}
                                  className={`flex-1 py-2 rounded-lg font-bold border transition-all ${
                                      custForm.type === type 
                                      ? 'bg-[#272727] text-[#EFD09E] border-[#272727]' 
                                      : 'bg-[#EFD09E]/45 text-[#7E5C4A] border-[#D4AA7D]/35 hover:bg-[#EFD09E]/70'
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
                          className="flex-1 py-3 bg-[#272727] text-[#EFD09E] font-bold rounded-xl hover:bg-[#1f1f1f] shadow-lg shadow-[#272727]/25 border border-[#EFD09E]/20 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#272727]/45 backdrop-blur-sm animate-fade-in">
           <div className="bg-[#EEF2F6]/95 border border-white/80 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button 
                  onClick={() => setIsPackageModalOpen(false)}
                  className="absolute right-4 top-4 text-[#7E5C4A] hover:text-[#272727]"
              >
                  <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center justify-between mb-6 pr-8">
                  <h3 className="text-xl font-bold text-[#272727]">
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
                      <label className="block text-sm font-bold text-[#7E5C4A] mb-1">Package Name</label>
                      <input 
                          type="text" 
                          value={pkgForm.name}
                          onChange={e => setPkgForm({...pkgForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-[#D4AA7D]/40 bg-[#EFD09E]/45 rounded-xl text-[#272727] outline-none focus:ring-2 focus:ring-[#9ACD32]/30"
                          placeholder="e.g. 110x110x110"
                          disabled={!!editingPackage} // Name is ID, usually immutable or requires special handling. Let's keep it editable only for New for now, or use a separate ID. 
                                                     // Actually user asked to "Edit" form to be usable. If they edit name, it's like a new package or rename.
                                                     // For simplicity in this array-based mock, let's allow editing name but we must handle "rename" logic in save.
                                                     // Wait, savePackage uses `editingPackage.name` to find index. If we change form name, we still have reference.
                                                     // So we can allow editing.
                          // Correction: If we allow editing Name, we need to ensure we don't duplicate keys. For now let's allow it.
                      />
                  </div>
                  
                  <div className="p-3 bg-[#EFD09E]/45 rounded-lg border border-[#D4AA7D]/35">
                      <div className="text-xs font-bold text-[#7E5C4A] mb-2 uppercase">Outer Dimensions (cm)</div>
                      <div className="grid grid-cols-3 gap-3">
                          <div>
                             <label className="block text-xs font-bold text-[#7E5C4A]/80 mb-1">Width</label>
                             <input type="number" value={pkgForm.outer.w} onChange={e => setPkgForm({ ...pkgForm, outer: { ...pkgForm.outer, w: Number(e.target.value) } })} className="w-full px-2 py-1 border border-[#D4AA7D]/40 rounded text-center bg-[#F6EDDE]" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-[#7E5C4A]/80 mb-1">Length</label>
                             <input type="number" value={pkgForm.outer.l} onChange={e => setPkgForm({ ...pkgForm, outer: { ...pkgForm.outer, l: Number(e.target.value) } })} className="w-full px-2 py-1 border border-[#D4AA7D]/40 rounded text-center bg-[#F6EDDE]" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-[#7E5C4A]/80 mb-1">Height</label>
                             <input type="number" value={pkgForm.outer.h} onChange={e => setPkgForm({ ...pkgForm, outer: { ...pkgForm.outer, h: Number(e.target.value) } })} className="w-full px-2 py-1 border border-[#D4AA7D]/40 rounded text-center bg-[#F6EDDE]" />
                          </div>
                      </div>
                  </div>

                  <div className="p-3 bg-[#9ACD32]/10 rounded-lg border border-[#9ACD32]/30">
                      <div className="text-xs font-bold text-[#5a7a1a] mb-2 uppercase flex justify-between">
                          <span>Inner Dimensions (cm)</span>
                          <span>Uses for Calcs</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                          <div>
                             <label className="block text-xs font-bold text-[#5a7a1a]/80 mb-1">Width</label>
                             <input type="number" value={pkgForm.inner.w} onChange={e => setPkgForm({ ...pkgForm, inner: { ...pkgForm.inner, w: Number(e.target.value) } })} className="w-full px-2 py-1 border border-[#9ACD32]/35 rounded text-center bg-[#F6EDDE] focus:ring-[#9ACD32]" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-[#5a7a1a]/80 mb-1">Length</label>
                             <input type="number" value={pkgForm.inner.l} onChange={e => setPkgForm({ ...pkgForm, inner: { ...pkgForm.inner, l: Number(e.target.value) } })} className="w-full px-2 py-1 border border-[#9ACD32]/35 rounded text-center bg-[#F6EDDE] focus:ring-[#9ACD32]" />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-[#5a7a1a]/80 mb-1">Height</label>
                             <input type="number" value={pkgForm.inner.h} onChange={e => setPkgForm({ ...pkgForm, inner: { ...pkgForm.inner, h: Number(e.target.value) } })} className="w-full px-2 py-1 border border-[#9ACD32]/35 rounded text-center bg-[#F6EDDE] focus:ring-[#9ACD32]" />
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-sm font-bold text-[#7E5C4A] mb-1">M3 Capacity</label>
                          <input type="number" step="0.0001" value={pkgForm.m3} onChange={e => setPkgForm({...pkgForm, m3: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-[#D4AA7D]/40 bg-[#EFD09E]/45 rounded-xl outline-none focus:ring-2 focus:ring-[#9ACD32]/30" />
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-[#7E5C4A] mb-1">Category</label>
                          <select 
                              value={pkgForm.category}
                              onChange={e => setPkgForm({...pkgForm, category: e.target.value as 'Box' | 'Pallet'})}
                              className="w-full px-3 py-2 border border-[#D4AA7D]/40 bg-[#EFD09E]/45 rounded-xl outline-none focus:ring-2 focus:ring-[#9ACD32]/30"
                          >
                              <option value="Box">Box</option>
                              <option value="Pallet">Pallet</option>
                          </select>
                       </div>
                  </div>

                  <div>
                      <label className="block text-sm font-bold text-[#7E5C4A] mb-2">Allowed Types</label>
                      <div className="flex gap-3">
                          {['A', 'E', 'R'].map(type => (
                               <label key={type} className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                     type="checkbox" 
                                     checked={pkgForm.types.includes(type)}
                                     onChange={() => togglePkgType(type)}
                                     className="w-5 h-5 text-[#9ACD32] rounded focus:ring-[#9ACD32]" 
                                  />
                                  <span className="font-bold text-[#7E5C4A]">{type}</span>
                               </label>
                          ))}
                      </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                      <button 
                          onClick={savePackage}
                          className="flex-1 py-3 bg-[#272727] text-[#EFD09E] font-bold rounded-xl hover:bg-[#1f1f1f] shadow-lg shadow-[#272727]/25 border border-[#EFD09E]/20 flex items-center justify-center gap-2"
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
