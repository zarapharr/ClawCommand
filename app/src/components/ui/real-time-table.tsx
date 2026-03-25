import React from "react";

/**
 * RealTimeTable Component
 * Data table for budget breakdown with real-time updates
 * @example
 * <RealTimeTable
 *   columns={[{ id: "name", label: "Project" }, { id: "budget", label: "Budget" }]}
 *   rows={[{ name: "Phase 3A", budget: "$50K" }]}
 *   loading={false}
 * />
 */
interface Column {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (value: any) => React.ReactNode;
}

interface Row {
  [key: string]: any;
}

interface RealTimeTableProps {
  columns: Column[];
  rows: Row[];
  rowKey?: string;
  loading?: boolean;
  highlight?: Set<string>;
  onRowClick?: (row: Row) => void;
  className?: string;
}

export const RealTimeTable: React.FC<RealTimeTableProps> = ({
  columns,
  rows,
  rowKey = "id",
  loading = false,
  highlight,
  onRowClick,
  className = "",
}) => {
  const alignClasses: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={`rounded-lg border border-neutral-700 bg-neutral-800/30 overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-700 bg-neutral-800/50">
            {columns.map((col) => (
              <th
                key={col.id}
                className={`px-4 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider ${alignClasses[col.align || "left"]}`}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-neutral-400">
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-neutral-400">
                No data
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const isHighlighted = highlight?.has(row[rowKey]);
              return (
                <tr
                  key={row[rowKey] || idx}
                  className={`border-b border-neutral-700/50 hover:bg-neutral-700/30 transition-colors cursor-pointer ${
                    isHighlighted ? "bg-primary-500/10" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={`px-4 py-3 text-sm text-neutral-300 ${alignClasses[col.align || "left"]}`}
                    >
                      {col.render ? col.render(row[col.id]) : row[col.id]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
