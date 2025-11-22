export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-8 bg-neutral-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
          <div className="h-10 w-24 bg-neutral-200 rounded"></div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-earth-beige rounded-lg">
          <div className="text-center">
            <div className="h-6 bg-neutral-200 rounded w-16 mx-auto mb-2"></div>
            <div className="h-3 bg-neutral-200 rounded w-12 mx-auto"></div>
          </div>
          <div className="text-center">
            <div className="h-6 bg-neutral-200 rounded w-16 mx-auto mb-2"></div>
            <div className="h-3 bg-neutral-200 rounded w-12 mx-auto"></div>
          </div>
          <div className="text-center">
            <div className="h-6 bg-neutral-200 rounded w-16 mx-auto mb-2"></div>
            <div className="h-3 bg-neutral-200 rounded w-12 mx-auto"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="card animate-pulse">
      <div className="space-y-3">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 pb-3 border-b border-neutral-200">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-neutral-200 rounded"></div>
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-neutral-200 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="card animate-pulse">
      <div className="space-y-6">
        {/* Avatar and Name */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-neutral-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-neutral-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 bg-neutral-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-neutral-200 rounded w-full"></div>
            </div>
          ))}
        </div>

        {/* Button */}
        <div className="h-10 bg-neutral-200 rounded w-32"></div>
      </div>
    </div>
  );
}
