export const DataTable = ({ data, columns }: any) => {
  return (
    <div className="border border-admin-border rounded-brand overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-admin-surface text-admin-text-secondary border-b border-admin-border">
          <tr>
            {columns.map((col: any) => (
              <th key={col.accessorKey} className="px-4 py-3">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i} className="bg-admin-surface hover:bg-admin-surface-hover border-b border-admin-border last:border-0">
              {columns.map((col: any) => (
                <td key={col.accessorKey} className="px-4 py-3">{row[col.accessorKey]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
