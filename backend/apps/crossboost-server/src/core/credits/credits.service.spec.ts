import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreditsService } from './credits.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test } from '@nestjs/testing'
import { CreditTransaction, CreditTransactionType, User } from '@crossboost/database'

describe('CreditsService', () => {
  let service: CreditsService
  let mockTransactionRepo: any
  let mockUserRepo: any

  beforeEach(async () => {
    mockTransactionRepo = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      findAndCount: vi.fn(),
    }
    mockUserRepo = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    }

    const module = await Test.createTestingModule({
      providers: [
        CreditsService,
        { provide: getRepositoryToken(CreditTransaction), useValue: mockTransactionRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile()

    service = module.get<CreditsService>(CreditsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should get balance', async () => {
    mockUserRepo.findOne.mockResolvedValue({
      id: 'user-1',
      credits: 100,
      updatedAt: new Date(),
    })

    const result = await service.getBalance('user-1')
    expect(result.userId).toBe('user-1')
    expect(result.balance).toBe(100)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })

  it('should throw when getting balance for non-existent user', async () => {
    mockUserRepo.findOne.mockResolvedValue(null)
    await expect(service.getBalance('nonexistent')).rejects.toThrow()
  })

  it('should throw when adding zero credits', async () => {
    await expect(service.addCredits('user-1', 0, 'Zero')).rejects.toThrow()
  })

  it('should throw when adding negative credits', async () => {
    await expect(service.addCredits('user-1', -10, 'Negative')).rejects.toThrow()
  })

  it('should throw when deducting zero credits', async () => {
    await expect(service.deductCredits('user-1', 0, 'Zero')).rejects.toThrow()
  })

  it('should throw when deducting negative credits', async () => {
    await expect(service.deductCredits('user-1', -5, 'Negative')).rejects.toThrow()
  })

  it('should throw when deducting more than balance', async () => {
    mockUserRepo.findOne.mockResolvedValue({
      id: 'user-1',
      credits: 10,
      updatedAt: new Date(),
    })
    await expect(service.deductCredits('user-1', 100, 'Overdraft')).rejects.toThrow()
  })

  it('should get transactions with defaults', async () => {
    mockTransactionRepo.findAndCount.mockResolvedValue([[], 0])

    const result = await service.getTransactions('user-1', {})
    expect(result.items).toEqual([])
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.total).toBe(0)
  })

  it('should get transactions with custom pagination', async () => {
    mockTransactionRepo.findAndCount.mockResolvedValue([[], 0])

    const result = await service.getTransactions('user-1', { page: 2, pageSize: 10 })
    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(10)
  })
})
