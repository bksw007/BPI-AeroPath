"use client";

import { useState, useEffect } from "react";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Modal } from "@/components/shared/Modal";
import { SearchToolbar } from "@/components/shared/SearchToolbar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { 
  Clock, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  History,
  ArrowRight,
  Upload
} from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
import { PackagingService, IActivityLog } from "@/lib/firebase/services/packaging.service";

export default function PackagingActivityPage() {
  const [activities, setActivities] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [selectedActivity, setSelectedActivity] = useState<IActivityLog | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      const data = await PackagingService.getActivities();
      const sorted = [...data].sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setActivities(sorted);
      setLoading(false);
    };
    fetchActivities();
  }, []);

  // Action icon and color mapping
  const getActionStyle = (action: string) => {
    switch (action) {
      case "Create":
        return { icon: <Plus className="w-3 h-3" />, color: "bg-[#9ACD32]/15 text-[#5a7a1a] border-[#9ACD32]/35" };
      case "Update":
        return { icon: <Edit className="w-3 h-3" />, color: "bg-[#D4AA7D]/20 text-[#7E5C4A] border-[#D4AA7D]/35" };
      case "Delete":
        return { icon: <Trash2 className="w-3 h-3" />, color: "bg-rose-50 text-rose-700 border-rose-100" };
      case "Import":
        return { icon: <Upload className="w-3 h-3" />, color: "bg-[#272727]/10 text-[#272727] border-[#272727]/20" };
      case "Export":
        return { icon: <FileText className="w-3 h-3" />, color: "bg-[#EFD09E] text-[#7E5C4A] border-[#D4AA7D]/40" };
      default:
        return { icon: null, color: "bg-[#EEF2F6] text-[#7E5C4A] border-[#D4AA7D]/35" };
    }
  };

  // Table Columns
  const columns: Column<IActivityLog>[] = [
    { 
      key: "timestamp", 
      header: "Date/Time", 
      type: "date",
      render: (val: unknown) => {
        if (!val) return "-";
        const v = val as { toDate?: () => Date } | Date | string | number;
        const date = (v && typeof v === 'object' && 'toDate' in v && typeof v.toDate === 'function') 
          ? v.toDate() 
          : new Date(v as Date | string | number);
        return (
          <div>
            <p className="font-bold text-[#272727]">{formatDate(date)}</p>
            <p className="text-xs text-[#7E5C4A]/80 font-medium">
              {date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
        );
      }
    },
    { 
      key: "action", 
      header: "Action", 
      align: "center",
      render: (val) => {
        const style = getActionStyle(val as string);
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${style.color}`}>
            {style.icon} {val as string}
          </span>
        );
      }
    },
    { 
      key: "project", 
      header: "Project", 
      align: "center",
      render: (val) => (
        <span className="px-2 py-1 bg-[#EFD09E]/60 text-[#7E5C4A] rounded-lg text-[10px] font-black uppercase tracking-tight border border-[#D4AA7D]/35">
          {val as string}
        </span>
      )
    },
    { 
      key: "targetName", 
      header: "Product / Resource",
      render: (val, row) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-[#272727]">{val as string}</p>
            <span className="px-1.5 py-0.5 bg-[#D4AA7D]/35 text-[#7E5C4A] rounded text-[10px] font-bold border border-[#D4AA7D]/35">
              {row.category}
            </span>
          </div>
          <p className="text-xs text-[#7E5C4A]/80 font-mono">ID: {row.targetId}</p>
        </div>
      )
    },
    { 
      key: "user", 
      header: "Performed By", 
      align: "center",
      render: (val) => (
        <span className="font-bold text-[#7E5C4A]">{val as string}</span>
      )
    },
  ];

  // Filter logic
  const filteredData = activities.filter((activity) => {
    const matchesSearch = 
      activity.targetName?.toLowerCase().includes(searchValue.toLowerCase()) ||
      activity.targetId?.toLowerCase().includes(searchValue.toLowerCase()) ||
      activity.user?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesAction = filterAction === "All" || activity.action === filterAction;
    return matchesSearch && matchesAction;
  });

  // Stats
  const today = new Date().toDateString();
  const todayCount = activities.filter(a => {
    const d = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    return d.toDateString() === today;
  }).length;

  const thisWeekCount = activities.filter(a => {
    const d = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="min-h-screen bg-[#F6EDDE] pt-20 pb-12">
      <div className="container-custom">
        <ModuleHeader
          title="Activity Log"
          description="Monitoring all changes and operations in Packaging Console module."
          backHref="/projects/packaging"
          backLabel="Packaging Console"
        >
          <div className="mt-8 space-y-6">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="p-6 flex items-center justify-between group bg-[#EEF2F6]/95 border border-white/80 shadow-[8px_8px_18px_rgba(166,180,200,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)] transition-all">
                <div>
                  <p className="text-[#7E5C4A] text-xs font-black uppercase tracking-widest">Today Activity</p>
                  <h3 className="text-4xl font-black text-[#272727] mt-2">{todayCount}</h3>
                  <p className="text-xs text-[#7E5C4A]/80 font-bold mt-1 tracking-tight">Recent updates today</p>
                </div>
                <div className="p-4 bg-[#272727]/10 text-[#272727] rounded-3xl group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8" />
                </div>
              </GlassCard>

              <GlassCard className="p-6 flex items-center justify-between group bg-[#EEF2F6]/95 border border-white/80 shadow-[8px_8px_18px_rgba(166,180,200,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)] transition-all">
                <div>
                  <p className="text-[#7E5C4A] text-xs font-black uppercase tracking-widest">Past 7 Days</p>
                  <h3 className="text-4xl font-black text-[#5a7a1a] mt-2">{thisWeekCount}</h3>
                  <p className="text-xs text-[#5a7a1a]/70 font-bold mt-1 tracking-tight">Active operations</p>
                </div>
                <div className="p-4 bg-[#9ACD32]/18 text-[#5a7a1a] rounded-3xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </GlassCard>

              <GlassCard className="p-6 flex items-center justify-between group bg-[#EEF2F6]/95 border border-white/80 shadow-[8px_8px_18px_rgba(166,180,200,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)] transition-all">
                <div>
                  <p className="text-[#7E5C4A] text-xs font-black uppercase tracking-widest">Total Logs</p>
                  <h3 className="text-4xl font-black text-[#7E5C4A] mt-2">{activities.length}</h3>
                  <p className="text-xs text-[#7E5C4A]/75 font-bold mt-1 tracking-tight">Full history records</p>
                </div>
                <div className="p-4 bg-[#D4AA7D]/30 text-[#7E5C4A] rounded-3xl group-hover:scale-110 transition-transform">
                  <History className="w-8 h-8" />
                </div>
              </GlassCard>
            </div>

            {/* Toolbar */}
            <div className="p-0">
              <SearchToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search by SKU, Product or User..."
                filterValue={filterAction}
                onFilterChange={setFilterAction}
                filterOptions={[
                  "All",
                  "Create",
                  "Update",
                  "Delete",
                  "Import",
                  "Export",
                ]}
                primaryButton={{
                  label: "Refresh Log",
                  icon: <History className="w-4 h-4" />,
                  onClick: () => window.location.reload(),
                }}
              />
            </div>

            {/* Data Table */}
            <DataTable
              columns={columns}
              data={filteredData}
              keyField="id"
              onRowClick={(row) => setSelectedActivity(row)}
              emptyMessage={loading ? "Loading history..." : "No activity records found."}
              className="bg-transparent backdrop-blur-none border-none shadow-none"
            />
          </div>
        </ModuleHeader>

        {/* Detail Modal */}
        <Modal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title="Activity Details"
          className="max-w-xl"
        >
          {selectedActivity && (
            <div className="space-y-6 py-2">
              <div className="flex justify-between items-center p-6 bg-[#EEF2F6]/90 rounded-[2rem] border border-white/80 shadow-inner">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-[0.2em]">Operation</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${getActionStyle(selectedActivity.action).color}`}>
                    {getActionStyle(selectedActivity.action).icon} {selectedActivity.action}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-[0.2em]">Timestamp</p>
                  <p className="font-black text-[#272727]">{formatDate(selectedActivity.timestamp?.toDate ? selectedActivity.timestamp.toDate() : new Date(selectedActivity.timestamp))}</p>
                  <p className="text-xs text-[#7E5C4A]/80 font-bold">
                    {selectedActivity.timestamp?.toDate ? selectedActivity.timestamp.toDate().toLocaleTimeString("th-TH") : new Date(selectedActivity.timestamp).toLocaleTimeString("th-TH")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 px-2">
                <div>
                  <p className="text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-[0.2em] mb-2">Subject</p>
                  <p className="font-black text-[#272727] text-lg leading-tight">{selectedActivity.targetName}</p>
                  <p className="text-xs text-[#7E5C4A]/75 font-mono mt-1 font-bold">SKU: {selectedActivity.targetId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-[0.2em] mb-2">Operator</p>
                  <p className="font-black text-[#272727] text-lg">{selectedActivity.user}</p>
                  <p className="text-xs text-[#9ACD32] font-black mt-1 uppercase tracking-tighter">Verified Session</p>
                </div>
              </div>

              {selectedActivity.changes && selectedActivity.changes.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-[0.2em] px-2">Modification Details</p>
                  <div className="space-y-3">
                    {selectedActivity.changes.map((change, idx) => (
                      <div key={idx} className="group bg-[#EEF2F6]/75 p-4 rounded-3xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-[#7E5C4A] uppercase tracking-widest">{change.field}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 p-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl truncate line-through opacity-60">
                            {change.before}
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#7E5C4A]/40" />
                          <div className="flex-1 p-2 bg-[#9ACD32]/15 text-[#5a7a1a] text-xs font-black rounded-xl truncate">
                            {change.after}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedActivity.details && (
                <div className="px-2">
                  <p className="text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-[0.2em] mb-2">Notes</p>
                  <div className="p-4 bg-[#EFD09E]/75 rounded-2xl border border-[#D4AA7D]/45 text-sm font-bold text-[#7E5C4A] italic">
                    &quot;{selectedActivity.details}&quot;
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedActivity(null)}
                className="w-full py-4 bg-[#272727] hover:bg-[#1f1f1f] text-[#EFD09E] rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#272727]/25 mt-4 border border-[#EFD09E]/20"
              >
                Close Trace
              </button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

