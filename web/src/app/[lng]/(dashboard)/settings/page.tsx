'use client'

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your CrossBoost platform preferences</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">AI Model Preferences</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Default Video Model</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm">
                <option>Gemini</option>
                <option>OpenAI Sora</option>
                <option>Grok</option>
                <option>Volcengine</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Default Image Model</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm">
                <option>DALL-E 3</option>
                <option>Gemini</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Default LLM</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm">
                <option>Claude Sonnet</option>
                <option>GPT-4o</option>
                <option>Gemini Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Default Language</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm">
                <option>English</option>
                <option>中文</option>
                <option>日本語</option>
                <option>한국어</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Credit Balance</h2>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary-600">1,000</div>
            <div className="text-sm text-gray-500">credits remaining</div>
            <button className="ml-auto px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              Purchase Credits
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
