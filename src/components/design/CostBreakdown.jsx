import { useState } from 'react';
import { calculateCostBreakdown } from '../../services/designGenerator.js';

export function CostBreakdown({ parts, material, totalCost }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!parts || !material) {
    return null;
  }

  const breakdown = calculateCostBreakdown(parts, material);

  return (
    <div className="card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">💰</div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">
              Cost Breakdown
            </h3>
            <p className="text-sm text-neutral-600">
              Detailed cost analysis by part
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-ikea-blue">
            ₹{totalCost.toFixed(2)}
          </span>
          <svg
            className={`w-6 h-6 text-neutral-600 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 px-2 font-semibold text-neutral-700">
                    Part
                  </th>
                  <th className="text-center py-2 px-2 font-semibold text-neutral-700">
                    Qty
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-neutral-700">
                    Volume
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-neutral-700">
                    Unit Cost
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-neutral-700">
                    Total
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-neutral-700">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((part, index) => (
                  <tr
                    key={part.id || index}
                    className="border-b border-neutral-100 hover:bg-earth-beige/30 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {part.name}
                        </div>
                        <div className="text-xs text-neutral-500 capitalize">
                          {part.type}
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 text-neutral-700">
                      {part.quantity}
                    </td>
                    <td className="text-right py-3 px-2 text-neutral-700 font-mono text-xs">
                      {part.volume.toLocaleString()} cm³
                    </td>
                    <td className="text-right py-3 px-2 text-neutral-700">
                      ₹{part.unitCost.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-2 font-semibold text-neutral-900">
                      ₹{part.totalPartCost.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className="inline-block px-2 py-1 bg-ikea-blue/10 text-ikea-blue rounded text-xs font-medium">
                        {part.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-300">
                  <td
                    colSpan="4"
                    className="py-3 px-2 text-right font-semibold text-neutral-900"
                  >
                    Total Cost:
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-ikea-blue text-lg">
                    ₹{totalCost.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="inline-block px-2 py-1 bg-ikea-blue text-white rounded text-xs font-medium">
                      100%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cost Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-200">
            <div className="text-center p-3 bg-earth-beige rounded">
              <div className="text-xs text-neutral-600 mb-1">Parts Types</div>
              <div className="text-xl font-bold text-neutral-900">
                {breakdown.length}
              </div>
            </div>
            <div className="text-center p-3 bg-earth-beige rounded">
              <div className="text-xs text-neutral-600 mb-1">Total Pieces</div>
              <div className="text-xl font-bold text-neutral-900">
                {breakdown.reduce((sum, part) => sum + part.quantity, 0)}
              </div>
            </div>
            <div className="text-center p-3 bg-earth-beige rounded">
              <div className="text-xs text-neutral-600 mb-1">Total Volume</div>
              <div className="text-xl font-bold text-neutral-900">
                {breakdown
                  .reduce((sum, part) => sum + part.volume * part.quantity, 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                <span className="text-sm">cm³</span>
              </div>
            </div>
            <div className="text-center p-3 bg-earth-beige rounded">
              <div className="text-xs text-neutral-600 mb-1">Avg Cost/Part</div>
              <div className="text-xl font-bold text-neutral-900">
                ₹
                {(
                  totalCost /
                  breakdown.reduce((sum, part) => sum + part.quantity, 0)
                ).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
