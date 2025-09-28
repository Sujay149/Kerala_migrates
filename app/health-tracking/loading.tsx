export default function HealthTrackingLoading() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-80 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="h-10 w-36 bg-gray-200 animate-pulse rounded"></div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1 */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
          </div>

          {/* Chart 2 */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-40 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
          </div>
        </div>

        {/* Recent Measurements Skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div>
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-3 w-12 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}