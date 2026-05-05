/**
 * Adapt Content Skill
 *
 * Adapts existing content for different platforms, languages, or markets
 * while preserving brand voice and marketing intent.
 */

export interface AdaptContentInput {
  /** Source content to adapt */
  content: string
  /** Target platform (e.g., "Amazon", "TikTok", "Instagram", "Shopify") */
  targetPlatform: string
  /** Target language */
  targetLanguage: string
  /** Source platform (for context) */
  sourcePlatform?: string
  /** Whether to preserve SEO keywords */
  preserveSeo?: boolean
  /** Desired tone for adapted content */
  tone?: string
  /** Additional adaptation instructions */
  instructions?: string
}

export interface AdaptContentOutput {
  /** Adapted content */
  adaptedContent: string
  /** Translated version (if target language differs from source) */
  translatedContent?: string
  /** Target platform */
  platform: string
  /** Target language */
  language: string
  /** List of changes made during adaptation */
  changes: string[]
}

export const SKILL_DEFINITION = {
  name: 'adapt-content' as const,
  description: 'Adapt existing content for different platforms, languages, or markets',
  parameters: {
    content: { type: 'string', description: 'Source content to adapt' },
    targetPlatform: {
      type: 'string',
      description: 'Target platform (e.g., Amazon, TikTok, Instagram, Shopify)',
    },
    targetLanguage: { type: 'string', description: 'Target language' },
    sourcePlatform: {
      type: 'string',
      description: 'Source platform (for context)',
      default: '',
    },
    preserveSeo: {
      type: 'boolean',
      description: 'Whether to preserve SEO keywords',
      default: true,
    },
    tone: { type: 'string', description: 'Desired tone for adapted content', default: '' },
    instructions: {
      type: 'string',
      description: 'Additional adaptation instructions',
      default: '',
    },
  },
}

export async function execute(params: Record<string, any>, context: any) {
  const {
    content,
    targetPlatform,
    targetLanguage,
    sourcePlatform = '',
    preserveSeo = true,
    tone = '',
    instructions = '',
  } = params

  // Platform-specific adaptation guidelines
  const platformGuidelines: Record<string, string> = {
    Amazon:
      'Follow Amazon listing guidelines: title under 200 chars, 5 bullet points with max 500 chars each, HTML description. Focus on SEO keywords and buyer intent.',
    Shopify:
      'Write engaging product descriptions optimized for DTC. Include storytelling elements and brand voice. SEO-friendly with meta description.',
    TikTok: 'Short, punchy copy optimized for mobile. Trend-aware language. Strong hook in first line. Include trending hashtags.',
    Instagram:
      'Visual-first copy with strong hook. Include relevant hashtags (20-30). Call to action. Emoji usage where appropriate.',
    'TikTok Shop':
      'Conversational, authentic tone. Focus on value proposition. Mobile-optimized with short paragraphs. Strong CTA.',
    eBay:
      'Clear, factual descriptions. Include all specifications. SEO-optimized title with brand and model. Competitive positioning.',
  }

  const guideline = platformGuidelines[targetPlatform] || platformGuidelines['Shopify']

  // Build the adaptation prompt
  const systemPrompt = `You are a cross-platform content adaptation expert.
Adapt the given content for the ${targetPlatform} platform in ${targetLanguage}.

Platform guidelines: ${guideline}
${tone ? `Desired tone: ${tone}` : ''}
${preserveSeo ? 'Preserve SEO keywords and search intent.' : ''}
${instructions ? `Additional instructions: ${instructions}` : ''}
${sourcePlatform ? `Source platform context: ${sourcePlatform}` : ''}

Return JSON with: { "adaptedContent": "...", "changes": ["..."] }`

  const adaptedResult = await context.chatService.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ],
    temperature: 0.5,
  })

  // Parse the result
  let parsed: { adaptedContent?: string; changes?: string[] }
  try {
    parsed = JSON.parse(adaptedResult.content)
  } catch {
    parsed = { adaptedContent: adaptedResult.content, changes: ['Content adapted'] }
  }

  // Translate if target language differs
  let translatedContent: string | undefined
  if (targetLanguage.toLowerCase() !== 'en' && targetLanguage.toLowerCase() !== 'english') {
    translatedContent = await context.chatService.translateContent(
      parsed.adaptedContent ?? adaptedResult.content,
      targetLanguage,
      `Platform: ${targetPlatform}`,
    )
  }

  return {
    type: 'adaptation',
    adaptedContent: parsed.adaptedContent ?? adaptedResult.content,
    translatedContent,
    platform: targetPlatform,
    language: targetLanguage,
    changes: parsed.changes ?? ['Content adapted for ' + targetPlatform],
    metadata: {
      sourcePlatform,
      preserveSeo,
      tone,
      contentLength: content.length,
    },
  }
}
