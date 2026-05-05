import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { config } from '../../../config'

export type LlmProvider = 'openai' | 'anthropic' | 'gemini'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  provider?: LlmProvider
  model?: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  /** Enable streaming via SSE */
  stream?: boolean
}

export interface ChatCompletionResult {
  provider: LlmProvider
  model: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ListingCopyRequest {
  productName: string
  productFeatures: string[]
  targetLanguage: string
  targetMarket: string
  platform: string
  tone?: 'professional' | 'casual' | 'luxury' | 'playful'
  maxLength?: number
  includeSeoKeywords?: boolean
}

export interface ListingCopyResult {
  title: string
  bulletPoints: string[]
  description: string
  seoKeywords: string[]
  translatedContent?: string
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)
  private openaiClient: OpenAI | null = null
  private anthropicClient: Anthropic | null = null

  private getOpenAIClient(): OpenAI {
    if (!this.openaiClient) {
      if (!config.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured')
      }
      this.openaiClient = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
        baseURL: config.OPENAI_BASE_URL,
      })
    }
    return this.openaiClient
  }

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      if (!config.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured')
      }
      this.anthropicClient = new Anthropic({
        apiKey: config.ANTHROPIC_API_KEY,
        baseURL: config.ANTHROPIC_BASE_URL,
      })
    }
    return this.anthropicClient
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const provider = options.provider ?? this.selectDefaultProvider()
    this.logger.log(`Chat request: provider=${provider}, model=${options.model}`)

    switch (provider) {
      case 'anthropic':
        return this.chatAnthropic(options)
      case 'gemini':
        return this.chatGemini(options)
      case 'openai':
      default:
        return this.chatOpenAI(options)
    }
  }

  /**
   * Stream chat completions as an async iterable of text chunks.
   */
  async *chatStream(
    options: ChatCompletionOptions,
  ): AsyncGenerator<string, void, undefined> {
    const provider = options.provider ?? this.selectDefaultProvider()
    this.logger.log(`Stream chat request: provider=${provider}`)

    if (provider === 'anthropic') {
      const client = this.getAnthropicClient()
      const stream = client.messages.stream({
        model: options.model ?? 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature,
        messages: options.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        system: options.messages.find((m) => m.role === 'system')?.content,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text
        }
      }
    } else {
      // OpenAI-compatible streaming (covers openai + gemini via compatible API)
      const client = this.getOpenAIClient()
      const stream = await client.chat.completions.create({
        model: options.model ?? this.getDefaultModel(provider),
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          yield delta
        }
      }
    }
  }

  /**
   * Generate product listing copy optimized for cross-border e-commerce.
   */
  async generateListingCopy(request: ListingCopyRequest): Promise<ListingCopyResult> {
    const systemPrompt = this.buildListingSystemPrompt(request)
    const userPrompt = this.buildListingUserPrompt(request)

    const result = await this.chat({
      provider: this.selectBestProviderForCopywriting(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    })

    return this.parseListingCopyResult(result.content)
  }

  /**
   * Translate content to a target language while preserving marketing intent.
   */
  async translateContent(
    content: string,
    targetLanguage: string,
    context?: string,
  ): Promise<string> {
    const result = await this.chat({
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in e-commerce and marketing content. Translate the following content to ${targetLanguage}. Preserve marketing tone, brand voice, and SEO value. ${context ? `Context: ${context}` : ''}`,
        },
        { role: 'user', content },
      ],
      temperature: 0.3,
    })

    return result.content
  }

  /**
   * Generate SEO keywords for a product listing.
   */
  async generateSeoKeywords(
    productName: string,
    productFeatures: string[],
    targetMarket: string,
    language: string,
  ): Promise<string[]> {
    const result = await this.chat({
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert for cross-border e-commerce. Return a JSON array of keyword strings, nothing else.',
        },
        {
          role: 'user',
          content: `Generate 15-20 SEO keywords for this product listing targeting ${targetMarket} market in ${language}:\n\nProduct: ${productName}\nFeatures: ${productFeatures.join(', ')}`,
        },
      ],
      temperature: 0.5,
    })

    try {
      const parsed = JSON.parse(result.content)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return result.content.split(',').map((k) => k.trim()).filter(Boolean)
    }
  }

  private async chatOpenAI(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const client = this.getOpenAIClient()
    const response = await client.chat.completions.create({
      model: options.model ?? 'gpt-4o',
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    })

    const choice = response.choices[0]
    return {
      provider: 'openai',
      model: response.model,
      content: choice?.message?.content ?? '',
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    }
  }

  private async chatAnthropic(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const client = this.getAnthropicClient()
    const systemMessage = options.messages.find((m) => m.role === 'system')
    const nonSystemMessages = options.messages.filter((m) => m.role !== 'system')

    const response = await client.messages.create({
      model: options.model ?? 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    return {
      provider: 'anthropic',
      model: response.model,
      content: textBlock?.text ?? '',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    }
  }

  private async chatGemini(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    // Gemini via OpenAI-compatible endpoint
    const client = this.getOpenAIClient()
    const response = await client.chat.completions.create({
      model: options.model ?? 'gemini-2.0-flash',
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    })

    const choice = response.choices[0]
    return {
      provider: 'gemini',
      model: response.model,
      content: choice?.message?.content ?? '',
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    }
  }

  private selectDefaultProvider(): LlmProvider {
    if (config.ANTHROPIC_API_KEY) return 'anthropic'
    if (config.OPENAI_API_KEY) return 'openai'
    if (config.GEMINI_API_KEY) return 'gemini'
    throw new Error('No LLM provider configured. Set at least one API key.')
  }

  private selectBestProviderForCopywriting(): LlmProvider {
    // Anthropic Claude is preferred for copywriting quality
    if (config.ANTHROPIC_API_KEY) return 'anthropic'
    if (config.OPENAI_API_KEY) return 'openai'
    if (config.GEMINI_API_KEY) return 'gemini'
    throw new Error('No LLM provider configured')
  }

  private getDefaultModel(provider: LlmProvider): string {
    switch (provider) {
      case 'anthropic':
        return 'claude-sonnet-4-20250514'
      case 'gemini':
        return 'gemini-2.0-flash'
      case 'openai':
      default:
        return 'gpt-4o'
    }
  }

  private buildListingSystemPrompt(request: ListingCopyRequest): string {
    return `You are an expert cross-border e-commerce copywriter specializing in ${request.platform} listings.
Target market: ${request.targetMarket}
Target language: ${request.targetLanguage}
Tone: ${request.tone ?? 'professional'}
${request.includeSeoKeywords ? 'Include SEO-optimized keywords naturally in the copy.' : ''}
${request.maxLength ? `Maximum description length: ${request.maxLength} characters.` : ''}

Return your response as JSON with this exact structure:
{
  "title": "Product title",
  "bulletPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "description": "Product description",
  "seoKeywords": ["keyword1", "keyword2", ...]
}`
  }

  private buildListingUserPrompt(request: ListingCopyRequest): string {
    return `Generate a compelling product listing for:

Product name: ${request.productName}
Key features:
${request.productFeatures.map((f) => `- ${f}`).join('\n')}

Write the listing in ${request.targetLanguage} for the ${request.targetMarket} market on ${request.platform}.`
  }

  private parseListingCopyResult(content: string): ListingCopyResult {
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, content]
      const jsonStr = jsonMatch[1]?.trim() ?? content
      const parsed = JSON.parse(jsonStr)

      return {
        title: parsed.title ?? '',
        bulletPoints: Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints : [],
        description: parsed.description ?? '',
        seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords : [],
        translatedContent: parsed.translatedContent,
      }
    } catch {
      this.logger.warn('Failed to parse listing copy JSON, returning raw content')
      return {
        title: '',
        bulletPoints: [],
        description: content,
        seoKeywords: [],
      }
    }
  }
}
