"use client";

import { useState, useEffect } from "react";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Modal } from "@/components/shared/Modal";
import { SearchToolbar } from "@/components/shared/SearchToolbar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Clock, CalendarDays, TrendingUp, Download, Plus, Edit, Trash2, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
import { ActivityService, ActivityLog } from "@/lib/firebase/services/activity.service";

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [filterYear, setFilterYear] = useState("All");
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await ActivityService.getRecent(200);
      // Ensure all timestamps are Date objects for easier handling
      const normalized = data.map(a => {
        let d: Date;
        if (a.timestamp instanceof Date) {
          d = a.timestamp;
        } else if (a.timestamp && typeof (a.timestamp as any).toDate === 'function') { // eslint-disable-line @typescript-eslint/no-explicit-any
          d = (a.timestamp as any).toDate(); // eslint-disable-line @typescript-eslint/no-explicit-any
        } else {
          d = new Date(a.timestamp as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        return { ...a, timestamp: d };
      });
      setActivities(normalized as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    fetchActivities();
  }, []);

  // Action icon and color mapping
  const getActionStyle = (action: string) => {
    switch (action) {
      case "Create":
        return { icon: <Plus className="w-3 h-3" />, color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
      case "Update":
        return { icon: <Edit className="w-3 h-3" />, color: "bg-blue-50 text-blue-700 border-blue-100" };
      case "Delete":
        return { icon: <Trash2 className="w-3 h-3" />, color: "bg-rose-50 text-rose-700 border-rose-100" };
      case "Export":
        return { icon: <FileText className="w-3 h-3" />, color: "bg-amber-50 text-amber-700 border-amber-100" };
      default:
        return { icon: null, color: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  };

  // Table Columns
  const columns: Column<ActivityLog>[] = [
    { 
      key: "timestamp", 
      header: "Date/Time", 
      type: "date",
      render: (val) => {
        const date = val as Date;
        return (
          <div>
            <p className="font-medium">{formatDate(date)}</p>
            <p className="text-xs text-slate-400">{date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        );
      }
    },
    { 
      key: "action", 
      header: "Action", 
      align: "center",
      render: (val) => {
        const style = getActionStyle(val);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.color}`}>
            {style.icon} {val}
          </span>
        );
      }
    },
    { 
      key: "module", 
      header: "Module", 
      align: "center",
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
          {val}
        </span>
      )
    },
    { key: "targetName", header: "Target" },
    { key: "user", header: "User", align: "center" },
  ];

  // Filter data
  const filteredData = activities.filter((activity) => {
    const activityDate = activity.timestamp as unknown as Date;
    const matchesSearch = 
      activity.targetName?.toLowerCase().includes(searchValue.toLowerCase()) ||
      activity.module?.toLowerCase().includes(searchValue.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesYear = filterYear === "All" || activityDate.getFullYear().toString() === filterYear;
    return matchesSearch && matchesYear;
  });

  // Stats calculation
  const now = new Date();
  const today = now.toDateString();
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);

  const todayCount = activities.filter(a => (a.timestamp as unknown as Date).toDateString() === today).length;
  const weekCount = activities.filter(a => (a.timestamp as unknown as Date) >= thisWeekStart).length;
  const monthCount = activities.filter(a => (a.timestamp as unknown as Date) >= thisMonthStart).length;

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <ModuleHeader
            title="Activity Log"
            description="ประวัติการทำงานทั้งหมด - การเพิ่ม แก้ไข ลบ และส่งออกข้อมูล"
          >
            <div className="space-y-6 mt-8">
              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Today</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{todayCount}</h3>
                    <p className="text-xs text-slate-400 mt-1">activities</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Clock className="w-6 h-6 text-indigo-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">This Week</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{weekCount}</h3>
                    <p className="text-xs text-emerald-600 mt-1 font-medium">Last 7 days</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CalendarDays className="w-6 h-6 text-emerald-600" />
                  </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">This Month</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{monthCount}</h3>
                    <p className="text-xs text-blue-500 mt-1 font-medium">All activities</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </GlassCard>
              </div>

              {/* Search Toolbar */}
              <SearchToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search activities..."
                filterValue={filterYear}
                onFilterChange={setFilterYear}
                primaryButton={{
                  label: "Export Log",
                  icon: <Download className="w-4 h-4" />,
                  onClick: () => console.log("Export activities"),
                }}
              />

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={filteredData}
                keyField="id"
                onRowClick={(row) => setSelectedActivity(row)}
                emptyMessage="No activities found"
              />
            </div>
          </ModuleHeader>

          {/* Activity Details Modal */}
          <Modal
            isOpen={!!selectedActivity}
            onClose={() => setSelectedActivity(null)}
            title={`Activity Details`}
            className="md:max-w-lg"
          >
            {selectedActivity && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex justify-between items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Action</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium border ${getActionStyle(selectedActivity.action).color}`}>
                      {getActionStyle(selectedActivity.action).icon} {selectedActivity.action}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase mb-1">Date/Time</p>
                    <p className="font-semibold text-slate-700">{formatDate(selectedActivity.timestamp as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    <p className="text-xs text-slate-400">{new Date(selectedActivity.timestamp as any).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Module</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {selectedActivity.module}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">User</p>
                    <p className="font-medium text-slate-700">{selectedActivity.user}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Target</p>
                  <p className="font-medium text-slate-700">{selectedActivity.targetName}</p>
                  <p className="text-xs text-slate-400">ID: {selectedActivity.targetId}</p>
                </div>

                {/* Changes (for Update action) */}
                {selectedActivity.changes && selectedActivity.changes.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-2">Changes</p>
                    <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Field</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Before</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedActivity.changes?.map((change: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                            <tr key={idx} className="border-t border-slate-100">
                              <td className="px-3 py-2 font-medium text-slate-700">{change.field}</td>
                              <td className="px-3 py-2 text-rose-600 line-through">{change.before}</td>
                              <td className="px-3 py-2 text-emerald-600 font-medium">{change.after}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setSelectedActivity(null)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30"
                  >
                    Close
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
