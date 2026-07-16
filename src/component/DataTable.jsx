import TableRow from "./TableRow";
import { Inbox } from "lucide-react";

function DataTable({ records, onReview }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-6 py-4 font-semibold">ID</th>
            <th className="px-6 py-4 font-semibold">Plant & Line</th>
            <th className="px-6 py-4 font-semibold">Shift Info</th>
            <th className="px-6 py-4 font-semibold">Production (tons)</th>
            <th className="px-6 py-4 font-semibold">Kiln Runtime (hrs)</th>
            <th className="px-6 py-4 font-semibold">Heat Consumption (MJ/kg)</th>
            <th className="px-6 py-4 font-semibold">TSR (%)</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-800/40">
          {records.length > 0 ? (
            records.map((record) => (
              <TableRow
                key={record.id}
                record={record}
                onReview={onReview}
              />
            ))
          ) : (
            <tr>
              <td colSpan="9" className="px-6 py-16 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-slate-500">
                    <Inbox size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300">No shift records found</h3>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;