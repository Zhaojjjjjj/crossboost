'use client'

import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your CrossBoost AI Agent. I can help you:\n\n- Generate product videos from images\n- Write multilingual listing copy\n- Analyze content performance\n- Adapt content for different platforms\n\nWhat would you like to do?',
    },
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    // TODO: Send to backend agent API
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Agent functionality will be connected to the backend AI service. This is a placeholder response.' },
      ])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <a href="/products" className="text-gray-600 hover:text-gray-900">← Back</a>
        <h1 className="text-lg font-semibold text-gray-900">🤖 AI Agent</h1>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the agent to create content, analyze performance..."
            className="flex-1 px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl text-sm hover:bg-primary-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
