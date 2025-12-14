export function DesignPartsTable({ parts }) {
  if (!parts || parts.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No parts available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead className="bg-neutral-50 dark:bg-neutral-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Part Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Dimensions (L×W×H cm)
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Material
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Qty
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
          {parts.map((part, index) => (
            <tr key={part.id || index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                {part.name}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                {part.type}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                {part.dimensions.length} × {part.dimensions.width} × {part.dimensions.height}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-neutral-300 dark:border-neutral-600"
                    style={{ backgroundColor: part.color }}
                    title={part.color}
                  />
                  {part.material}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-neutral-900 dark:text-white text-center font-semibold">
                {part.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
