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
  requiredInput: ['content', 'targetPlatform', 'targetLanguage'] as const,
  optionalInput: ['sourcePlatform', 'preserveSeo', 'tone', 'instructions'] as const,
  outputSchema: {
    adaptedContent: 'string',
    translatedContent: 'string?',
    platform: 'string',
    language: 'string',
    changes: 'string[]',
  },
}
