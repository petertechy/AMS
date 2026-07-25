import { listActivityLog } from "@/lib/models";

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditLogsPage() {
  const entries = await listActivityLog(100);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Audit Logs</h1>
      <p className="text-sm text-slate-500 mb-6">
        The most recent 100 asset, allocation, and account changes across the organisation.
      </p>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Timestamp</th>
              <th className="text-left px-4 py-2 font-medium">Actor</th>
              <th className="text-left px-4 py-2 font-medium">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{formatDateTime(e.created_at)}</td>
                <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{e.actor_name}</td>
                <td className="px-4 py-2.5 text-slate-800">{e.summary}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
