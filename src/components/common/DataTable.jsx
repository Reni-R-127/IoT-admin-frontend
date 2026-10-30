import "./DataTable.css";
export default function DataTable({
  columns = [],
  rows = [],
  getRowId,
  onEdit,
  onDelete,
  emptyMessage = "No records found.",
}) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}

            {(onEdit || onDelete) && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                className="empty-state"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={getRowId?.(row) ?? row._id ?? index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(row)
                      : row[column.key] ?? "—"}
                  </td>
                ))}

                {(onEdit || onDelete) && (
                  <td className="table-actions">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                      >
                        Edit
                      </button>
                    )}

                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
