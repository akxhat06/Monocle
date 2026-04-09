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
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      {title ? <h3 className="border-b border-zinc-800 px-4 py-3 text-sm font-medium">{title}</h3> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              {columns.map((column) => (
                <th key={column} className="px-4 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-zinc-900/70">
                {columns.map((column) => (
                  <td key={column} className="px-4 py-2 text-zinc-200">
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
