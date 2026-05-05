import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContentService } from './content.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test } from '@nestjs/testing'
import { ContentTask, ContentTaskType, ContentTaskStatus } from '@crossboost/database'

describe('ContentService', () => {
  let service: ContentService
  let mockRepo: any

  beforeEach(async () => {
    mockRepo = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      findAndCount: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    }

    const module = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: getRepositoryToken(ContentTask), useValue: mockRepo },
      ],
    }).compile()

    service = module.get<ContentService>(ContentService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create content task', async () => {
    const contentData = {
      type: ContentTaskType.VIDEO,
      platform: 'tiktok',
    }

    mockRepo.create.mockImplementation((data) => data)
    mockRepo.save.mockImplementation(async (data) => ({ id: 'task-1', ...data }))

    const result = await service.create('user-1', contentData)
    expect(result.type).toBe(ContentTaskType.VIDEO)
    expect(result.userId).toBe('user-1')
    expect(result.id).toBe('task-1')
    expect(result.status).toBe(ContentTaskStatus.PENDING)
  })

  it('should list content with defaults', async () => {
    mockRepo.findAndCount.mockResolvedValue([[], 0])

    const result = await service.list('user-1', {})
    expect(result.items).toEqual([])
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.totalPages).toBe(0)
  })

  it('should list content with custom pagination', async () => {
    mockRepo.findAndCount.mockResolvedValue([[], 0])

    const result = await service.list('user-1', { page: 3, pageSize: 5 })
    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(5)
  })

  it('should throw on getById for non-existent content', async () => {
    mockRepo.findOne.mockResolvedValue(null)
    await expect(service.getById('nonexistent', 'user-1')).rejects.toThrow()
  })

  it('should create video content', async () => {
    mockRepo.create.mockImplementation((data) => data)
    mockRepo.save.mockImplementation(async (data) => ({ id: 'task-2', ...data }))

    const contentData = {
      type: ContentTaskType.VIDEO,
      platform: 'instagram',
      input: { url: 'https://example.com/video.mp4' },
    }

    const result = await service.create('user-1', contentData)
    expect(result.type).toBe(ContentTaskType.VIDEO)
  })
})
