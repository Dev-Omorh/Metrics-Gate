import StatusBadge from "./StatusBadge";
import { ShieldAlert, CheckCircle2, Clock } from "lucide-react";

function TableRow({ record, onReview }) {
  const violations = record.violations || [];
  const isFlagged = record.status === "FLAGGED";

  // Only highlight a value amber if a real backend rule actually flagged it.
  // Do not guess thresholds client side, let the backend's violations array decide.
  const violatesRule = (ruleId) => violations.some((v) => v.ruleId === ruleId);

  return (
    <tr className="border-b border-slate-800/60 bg-slate-900/10 hover:bg-slate-800/40 transition-colors group">
      {/* ID */}
      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
        #{record.id}
      </td>

      {/* Plant & Line
          Note: the backend has no operator field (no operator name or ID).
          If the dashboard needs an operator column, that field must be added
          to the backend response first, not invented on the frontend. */}
      <td className="px-6 py-4">
        <div className="space-y-0.5">
          <div className="font-semibold text-white group-hover:text-violet-400 transition-colors text-sm">
            {record.plant}
          </div>
          <div className="text-xs text-slate-400">
            {record.line}
          </div>
        </div>
      </td>

      {/* Shift Date & Type */}
      <td className="px-6 py-4">
        <div className="space-y-0.5">
          <div className="text-sm text-slate-300 font-medium">{record.date}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={10} className="text-slate-500" />
            {record.shift} Shift
          </div>
        </div>
      </td>

      {/* Clinker Production (tons) */}
      <td className="px-6 py-4 text-sm font-medium text-slate-300">
        {record.clinker_production_tons != null
          ? record.clinker_production_tons.toLocaleString()
          : "—"}
      </td>

      {/* Kiln Runtime (hours) — this is the one rule the backend guide
          actually documents: RULE_1_TIME_LIMIT, max 24 hours per day. */}
      <td
        className={`px-6 py-4 text-sm font-medium ${
          violatesRule("RULE_1_TIME_LIMIT") ? "text-amber-400" : "text-slate-300"
        }`}
      >
        {record.kiln_runtime_hours != null ? `${record.kiln_runtime_hours} hrs` : "—"}
      </td>

      {/* Heat Consumption (MJ/kg) */}
      <td className="px-6 py-4 text-sm font-medium text-slate-300">
        {record.heat_consumption_mj_per_kg != null
          ? record.heat_consumption_mj_per_kg.toLocaleString()
          : "—"}
      </td>

      {/* Thermal Substitution Rate (%) */}
      <td className="px-6 py-4 text-sm font-medium text-slate-300">
        {record.tsr_percent != null ? `${record.tsr_percent}%` : "—"}
      </td>

      {/* Status Badge & Violation Details */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          <StatusBadge status={record.status} />
          {isFlagged &&
            violations.map((v) => (
              <div
                key={v.ruleId}
                className="max-w-[220px] text-[10px] text-slate-400 leading-normal border-l border-slate-700 pl-1.5 italic"
              >
                <span className="font-semibold text-slate-300 not-italic">{v.flag}:</span>{" "}
                {v.description}
              </div>
            ))}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        {isFlagged ? (
          <button
            onClick={() => onReview(record)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-slate-950 text-xs font-bold transition-all shadow-[0_0_10px_rgba(245,158,11,0.15)]"
          >
            <ShieldAlert size={13} />
            Review
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none pr-3">
            <CheckCircle2 size={13} className="text-slate-600" />
            Verified
          </div>
        )}
      </td>
    </tr>
  );
}

export default TableRow;