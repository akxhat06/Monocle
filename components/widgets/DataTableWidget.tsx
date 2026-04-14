export default function DataTableWidget({
  title,
  columns,
  rows
}: {
  title?: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#1c1c1c]">
      {title ? <h3 className="border-b border-white/[0.06] px-4 py-3 text-sm font-medium text-[#c0c0c0]">{title}</h3> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[#5a5a5a]">
              {columns.map((column) => (
                <th key={column} className="px-4 py-2 font-medium uppercase tracking-wider text-[10px]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                {columns.map((column) => (
                  <td key={column} className="px-4 py-2.5 text-[#c0c0c0]">
                    {String(row[column] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
