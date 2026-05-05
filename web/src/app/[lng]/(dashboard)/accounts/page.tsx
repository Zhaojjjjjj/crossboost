'use client'

const platforms = [
  { id: 'tiktok_shop', name: 'TikTok Shop', icon: '🎵', connected: false },
  { id: 'instagram', name: 'Instagram', icon: '📸', connected: false },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: false },
  { id: 'youtube', name: 'YouTube', icon: '▶️', connected: false },
]

export default function AccountsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
        <p className="text-gray-600 mt-1">Connect your e-commerce and social media accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <div key={platform.id} className="bg-white rounded-xl border p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{platform.icon}</span>
              <div>
                <div className="font-semibold text-gray-900">{platform.name}</div>
                <div className="text-sm text-gray-500">
                  {platform.connected ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg text-sm ${
                platform.connected
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {platform.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
