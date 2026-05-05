import Link from 'next/link'

const features = [
  {
    title: 'Product Management',
    description: 'Manage your product catalog with SKU, images, and selling points',
    href: '/products',
    icon: '📦',
  },
  {
    title: 'Content Studio',
    description: 'AI-powered product video, image, and listing copy generation',
    href: '/content',
    icon: '🎨',
  },
  {
    title: 'Multi-Platform Publishing',
    description: 'One-click publish to TikTok Shop, Instagram, Pinterest, YouTube',
    href: '/publish',
    icon: '📢',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Track content performance and ROI across all platforms',
    href: '/analytics',
    icon: '📊',
  },
  {
    title: 'AI Agent',
    description: 'Natural language interface for content creation and analysis',
    href: '/agent',
    icon: '🤖',
  },
  {
    title: 'Account Management',
    description: 'Connect and manage your e-commerce platform accounts',
    href: '/accounts',
    icon: '🔗',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-600">CrossBoost</span>
            <span className="text-sm text-gray-500">AI Content Platform</span>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Login</Link>
            <Link href="/auth/register" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Cross-Border<br />
            <span className="text-primary-600">Content Marketing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate product videos, write multilingual listings, publish to 4+ platforms,
            and track performance — all powered by AI Agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
