'use client'

export default function ContentPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Studio</h1>
        <p className="text-gray-600 mt-1">Generate AI-powered product videos, images, and listing copy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-3xl mb-3">🎬</div>
          <h3 className="font-semibold text-gray-900">Product Video</h3>
          <p className="text-sm text-gray-600 mt-1">Generate short-form product videos using AI. Supports TikTok, Instagram Reels format.</p>
          <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
            Start Creating
          </button>
        </div>
        <div className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-3xl mb-3">🖼️</div>
          <h3 className="font-semibold text-gray-900">Product Images</h3>
          <p className="text-sm text-gray-600 mt-1">Create marketing visuals, lifestyle shots, and infographics for your products.</p>
          <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
            Start Creating
          </button>
        </div>
        <div className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-3xl mb-3">✍️</div>
          <h3 className="font-semibold text-gray-900">Listing Copy</h3>
          <p className="text-sm text-gray-600 mt-1">Write multilingual, SEO-optimized product descriptions and titles.</p>
          <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
            Start Creating
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-gray-900">Recent Content</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>No content generated yet. Select a product and start creating!</p>
        </div>
      </div>
    </div>
  )
}
