/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import Navbar from "./component/Navbar";
import StatsCard from "./component/StatsCard";
import DataTable from "./component/DataTable";
import ActionModal from "./component/ActionModal";
import AddRecordModal from "./component/AddRecordModal";
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  XCircle, 
  Search, 
  Plus, 
  RefreshCw, 
  Filter,
  AlertCircle
} from "lucide-react";

const API_BASE_URL = "https://metric-gate-backend.onrender.com/api";

// NOTE: this no longer renames fields. TableRow/DataTable expect the real
// backend field names (record.plant, record.date, record.shift,
// record.clinker_production_tons, record.kiln_runtime_hours,
// record.heat_consumption_mj_per_kg, record.tsr_percent, record.violations).
// Renaming them here just recreates the same mismatch we already fixed once.
//
// operator_id: UNCONFIRMED. The backend guide this project was built against
// does not document this field. Verify in the raw network response whether
// the live API actually returns operator_id before trusting this column;
// otherwise every row will silently show "Unknown".
function mapRecord(r) {
  return {
    ...r,
    escalationStatus: r.escalation ? r.escalation.status : null,
    managerReason: r.escalation && r.escalation.reason ? r.escalation.reason : null,
  };
}

function Dashboard() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    flagged: 0,
    approved: 0,
    rejected: 0
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState("");

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch all records and statistics
  const fetchData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    else setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE_URL}/telemetry/validated`);
      if (!res.ok) throw new Error("Failed to load dashboard data from server.");
      const data = await res.json();

      let mapped = data.map(mapRecord);

      if (statusFilter !== "ALL") {
        mapped = mapped.filter((r) => {
          if (statusFilter === "PASSED") return r.status === "PASSED";
          if (statusFilter === "FLAGGED") return r.status === "FLAGGED" && (!r.escalationStatus || r.escalationStatus === "pending");
          if (statusFilter === "APPROVED") return r.escalationStatus === "approved";
          if (statusFilter === "REJECTED") return r.escalationStatus === "rejected";
          return true;
        });
      }

      if (search.trim() !== "") {
        const q = search.trim().toLowerCase();
        mapped = mapped.filter((r) => {
          const plant = (r.plant || "").toLowerCase();
          const operator = (r.operator_id || "").toLowerCase();
          return plant.includes(q) || operator.includes(q);
        });
      }

      setStats({
        total: data.length,
        passed: data.filter((r) => r.status === "PASSED").length,
        flagged: data.filter((r) => r.status === "FLAGGED").length,
        approved: data.filter((r) => r.escalation?.status === "approved").length,
        rejected: data.filter((r) => r.escalation?.status === "rejected").length,
      });

      setRecords(mapped);
    } catch (err) {
      console.error(err);
      setApiError(err.message || "Unable to connect to the backend server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Trigger fetch when search or filter changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 200); // Small debounce to avoid spamming the backend while typing

    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  // Submit action review (Approve / Reject Exception)
  const handleActionSubmit = async (id, payload) => {
    const endpoint = payload.action === "APPROVED" ? "approve" : "reject";
    const res = await fetch(`${API_BASE_URL}/exceptions/${id}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: payload.reason, actor: "Plant Manager" }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to submit exception action.");
    }

    // Refresh dashboard records and stats
    await fetchData();
  };

  // Log Shift feature is disabled for this submission (backend does not yet
  // accept this data shape). Kept as a harmless stub so nothing breaks if
  // the modal is ever opened.
  const handleAddRecordSubmit = async (_payload) => {
    setIsAddModalOpen(false);
  };

  const openReviewModal = (record) => {
    setSelectedRecord(record);
    setIsActionModalOpen(true);
  };

  const filterTabs = [
    { key: "ALL", label: "All Logs" },
    { key: "PASSED", label: "Passed" },
    { key: "FLAGGED", label: "Exceptions" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* API Error Alert */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3 shadow-lg">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <div>
              <h4 className="font-semibold text-rose-300">Connection Error</h4>
              <p className="text-sm text-rose-400/90 mt-1">{apiError}</p>
              <button 
                onClick={() => fetchData()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors active:scale-[0.98]"
              >
                <RefreshCw size={12} /> Try Reconnecting
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard 
            title="Total Records" 
            value={stats.total} 
            icon={Database} 
            accentClass="from-slate-500/10 to-transparent border-slate-800 text-slate-400"
          />
          <StatsCard 
            title="Passed" 
            value={stats.passed} 
            icon={CheckCircle2} 
            accentClass="from-emerald-500/10 to-transparent border-emerald-500/10 text-emerald-400 hover:border-emerald-500/30"
          />
          <StatsCard 
            title="Exceptions" 
            value={stats.flagged} 
            icon={AlertTriangle} 
            accentClass="from-amber-500/10 to-transparent border-amber-500/10 text-amber-400 hover:border-amber-500/30"
          />
          <StatsCard 
            title="Approved" 
            value={stats.approved} 
            icon={ShieldCheck} 
            accentClass="from-sky-500/10 to-transparent border-sky-500/10 text-sky-400 hover:border-sky-500/30"
          />
          <StatsCard 
            title="Rejected" 
            value={stats.rejected} 
            icon={XCircle} 
            accentClass="from-rose-500/10 to-transparent border-rose-500/10 text-rose-400 hover:border-rose-500/30"
          />
        </div>

        {/* Search, Filter and Actions Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-900/40 p-4 border border-slate-800 rounded-2xl backdrop-blur-sm">
          
          {/* Left: Tab status filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2 shrink-0">
              <Filter size={12} />
              <span>Status:</span>
            </div>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide border transition-all shrink-0 ${
                  statusFilter === tab.key
                    ? "bg-violet-600/10 border-violet-500/40 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                    : "bg-slate-950/20 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Search & Create */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search plant or operator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-850 bg-slate-950/40 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700"
              />
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="rounded-xl border border-slate-850 p-2 bg-slate-950/40 text-slate-400 hover:text-white hover:border-slate-850 hover:bg-slate-900 active:scale-[0.97] transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>

            <button
              style={{ display: 'none' }}
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.97] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.25)]"
            >
              <Plus size={15} />
              Log Shift
            </button>
          </div>
        </div>

        {/* Records Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-white tracking-wide">Plant Shift Ledger</h3>
            <span className="text-xs text-slate-500">{records.length} records found</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 border border-slate-800 rounded-2xl bg-slate-900/20">
              <RefreshCw className="animate-spin text-violet-500" size={32} />
              <span className="text-xs text-slate-400 font-medium">Fetching operation ledger...</span>
            </div>
          ) : (
            <DataTable 
              records={records} 
              onReview={openReviewModal} 
            />
          )}
        </div>

      </main>

      {/* Review Exception Action Modal */}
      <ActionModal
        isOpen={isActionModalOpen}
        record={selectedRecord}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleActionSubmit}
      />

      {/* Log Shift Modal */}
      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddRecordSubmit}
      />
    </div>
  );
}

export default Dashboard;