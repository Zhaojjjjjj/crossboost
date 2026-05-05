import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AccountService } from './account.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test } from '@nestjs/testing'
import { Account, PlatformType } from '@crossboost/database'

describe('AccountService', () => {
  let service: AccountService
  let mockRepo: any

  beforeEach(async () => {
    mockRepo = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    }

    const module = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: getRepositoryToken(Account), useValue: mockRepo },
      ],
    }).compile()

    service = module.get<AccountService>(AccountService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should list accounts by user id', async () => {
    const mockAccounts = [
      { id: '1', userId: 'user-1', platform: 'tiktok', displayName: 'My TikTok' },
      { id: '2', userId: 'user-1', platform: 'instagram', displayName: 'My IG' },
    ]
    mockRepo.find.mockResolvedValue(mockAccounts)
    const result = await service.listByUserId('user-1')
    expect(result).toHaveLength(2)
    expect(mockRepo.find).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
  })

  it('should get account by id', async () => {
    const mockAccount = { id: '1', userId: 'user-1', platform: 'tiktok' }
    mockRepo.findOne.mockResolvedValue(mockAccount)
    const result = await service.getById('1', 'user-1')
    expect(result).toEqual(mockAccount)
  })

  it('should throw when account not found', async () => {
    mockRepo.findOne.mockResolvedValue(null)
    await expect(service.getById('999', 'user-1')).rejects.toThrow()
  })

  it('should connect an account', async () => {
    const authData = {
      platformAccountId: 'tiktok-123',
      displayName: 'My TikTok',
      accessToken: 'token-abc',
    }
    mockRepo.create.mockImplementation((data) => data)
    mockRepo.save.mockImplementation(async (data) => ({ id: '1', ...data }))

    const result = await service.connect('user-1', PlatformType.TIKTOK, authData)
    expect(result.id).toBe('1')
    expect(result.platform).toBe(PlatformType.TIKTOK)
    expect(mockRepo.create).toHaveBeenCalled()
    expect(mockRepo.save).toHaveBeenCalled()
  })

  it('should disconnect an account', async () => {
    const mockAccount = { id: '1', userId: 'user-1' }
    mockRepo.findOne.mockResolvedValue(mockAccount)
    mockRepo.softDelete.mockResolvedValue(undefined)

    await service.disconnect('1', 'user-1')
    expect(mockRepo.softDelete).toHaveBeenCalledWith('1')
  })

  it('should update tokens', async () => {
    mockRepo.update.mockResolvedValue(undefined)
    await service.updateTokens('1', { accessToken: 'new-token', refreshToken: 'refresh' })
    expect(mockRepo.update).toHaveBeenCalledWith('1', {
      accessToken: 'new-token',
      refreshToken: 'refresh',
      expiresAt: null,
    })
  })
})
