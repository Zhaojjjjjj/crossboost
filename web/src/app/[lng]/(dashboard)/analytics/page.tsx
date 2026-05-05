'use client'

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track content performance and ROI across all platforms</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Views', value: '—', change: '' },
          { label: 'Total Engagement', value: '—', change: '' },
          { label: 'Content Published', value: '—', change: '' },
          { label: 'Est. Revenue', value: '—', change: '' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance Over Time</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will appear once data is available
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Performing Content</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Content rankings will appear here
          </div>
        </div>
      </div>
    </div>
  )
}
