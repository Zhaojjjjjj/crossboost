'use client'

export default function PublishPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publish</h1>
          <p className="text-gray-600 mt-1">Distribute content across TikTok Shop, Instagram, Pinterest, and YouTube</p>
        </div>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
          + New Publish Task
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { name: 'TikTok Shop', posts: 24, icon: '🎵' },
          { name: 'Instagram', posts: 18, icon: '📸' },
          { name: 'Pinterest', posts: 12, icon: '📌' },
          { name: 'YouTube', posts: 6, icon: '▶️' },
        ].map((platform) => (
          <div key={platform.name} className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{platform.icon}</span>
              <div>
                <div className="font-medium text-gray-900">{platform.name}</div>
                <div className="text-sm text-gray-500">{platform.posts} posts</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-gray-900">Publish History</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>No publish records yet. Connect an account and start publishing!</p>
        </div>
      </div>
    </div>
  )
}
