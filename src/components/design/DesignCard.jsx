import { Link, useNavigate } from 'react-router-dom';

export function DesignCard({ design, onDelete }) {
  const navigate = useNavigate();
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Are you sure you want to delete this ${design.furnitureType}?`)) {
      onDelete(design.id);
    }
  };

  return (
    <Link to={`/designs/${design.id}`}>
      <div className="card hover:shadow-soft transition-all duration-200 cursor-pointer group">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 capitalize group-hover:text-ikea-blue transition-colors">
              {design.furnitureType}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Created {formatDate(design.createdAt)}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xl sm:text-2xl font-bold text-ikea-blue">
              ${design.totalCost?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* Design Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
            <span className="font-medium">Material:</span>
            <div className="flex items-center gap-1 capitalize">
              <div
                className="w-3 h-3 rounded border border-neutral-300"
                style={{ backgroundColor: design.materialColor }}
              />
              {design.material}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
            <span className="font-medium">Dimensions:</span>
            <span className="font-mono text-xs sm:text-sm">
              {design.dimensions?.length} × {design.dimensions?.width} × {design.dimensions?.height} cm
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
            <span className="font-medium">Parts:</span>
            <span>{design.parts?.length || 0} types</span>
          </div>
        </div>

        {/* AI Badge */}
        {design.aiEnhanced && (
          <div className="mb-4 px-3 py-1.5 bg-gradient-to-r from-ikea-blue to-ikea-electric rounded text-white text-xs font-semibold inline-block">
            🤖 AI-Enhanced
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-neutral-200">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/designs/${design.id}`);
            }}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-ikea-blue hover:bg-primary-50 rounded transition-colors"
          >
            View Details
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </Link>
  );
}
