'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const mockData = {
  overview: [
    { name: 'Mon', views: 4000, engagement: 2400 },
    { name: 'Tue', views: 3000, engagement: 1398 },
    { name: 'Wed', views: 2000, engagement: 9800 },
    { name: 'Thu', views: 2780, engagement: 3908 },
    { name: 'Fri', views: 1890, engagement: 4800 },
    { name: 'Sat', views: 2390, engagement: 3800 },
    { name: 'Sun', views: 3490, engagement: 4300 },
  ],
  platforms: [
    { name: 'TikTok Shop', value: 45, color: '#000000' },
    { name: 'Instagram', value: 30, color: '#E1306C' },
    { name: 'Pinterest', value: 15, color: '#BD081C' },
    { name: 'YouTube', value: 10, color: '#FF0000' },
  ],
  topContent: [
    { id: 1, title: 'Wireless Earbuds Demo', platform: 'TikTok', views: 125000, engagement: 8500, revenue: 1200 },
    { id: 2, title: 'Smart Watch Review', platform: 'Instagram', views: 89000, engagement: 5200, revenue: 890 },
    { id: 3, title: 'Phone Charger Comparison', platform: 'YouTube', views: 45000, engagement: 3100, revenue: 560 },
  ],
}

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track content performance and ROI across all platforms</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Views', value: '337K', change: '+12.5%' },
          { label: 'Total Engagement', value: '35.4K', change: '+8.2%' },
          { label: 'Content Published', value: '60', change: '+15' },
          { label: 'Est. Revenue', value: '$2,650', change: '+$450' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-6">
            <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-green-600 mt-1">{stat.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Views & Engagement (7 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockData.overview}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#3b82f6" />
              <Bar dataKey="engagement" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Platform Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={mockData.platforms} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                {mockData.platforms.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-gray-900">Top Performing Content</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockData.topContent.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.platform}</td>
                <td className="px-6 py-4 text-sm">{item.views.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm">{item.engagement.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">${item.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
