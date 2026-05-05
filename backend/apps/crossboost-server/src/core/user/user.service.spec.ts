import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserService } from './user.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test } from '@nestjs/testing'
import { User, UserStatus } from '@crossboost/database'

describe('UserService', () => {
  let service: UserService
  let mockRepo: any

  beforeEach(async () => {
    mockRepo = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      count: vi.fn(),
      createQueryBuilder: vi.fn(),
    }

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should get user by id', async () => {
    const mockUser = { id: '1', name: 'Test', email: 'test@test.com' }
    mockRepo.findOne.mockResolvedValue(mockUser)
    const result = await service.getById('1')
    expect(result).toEqual(mockUser)
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } })
  })

  it('should return null for non-existent user', async () => {
    mockRepo.findOne.mockResolvedValue(null)
    const result = await service.getById('999')
    expect(result).toBeNull()
  })

  it('should get user by email', async () => {
    const mockUser = { id: '1', name: 'Test', email: 'test@test.com' }
    mockRepo.findOne.mockResolvedValue(mockUser)
    const result = await service.getByEmail('test@test.com')
    expect(result).toEqual(mockUser)
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } })
  })

  it('should register a new user', async () => {
    mockRepo.findOne.mockResolvedValue(null) // no existing user
    mockRepo.create.mockImplementation((data) => data)
    mockRepo.save.mockImplementation(async (data) => ({ id: '2', ...data }))

    const result = await service.register('new@test.com', 'password123', 'New User')
    expect(result.id).toBe('2')
    expect(result.email).toBe('new@test.com')
    expect(result.name).toBe('New User')
  })

  it('should throw on duplicate email registration', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1', email: 'existing@test.com' })
    await expect(service.register('existing@test.com', 'pass', 'Name')).rejects.toThrow()
  })

  it('should get user profile', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      status: UserStatus.ACTIVE,
      credits: 100,
      locale: 'en',
      timezone: null,
      createdAt: new Date(),
    }
    mockRepo.findOne.mockResolvedValue(mockUser)
    const result = await service.getProfile('1')
    expect(result.id).toBe('1')
    expect(result.email).toBe('test@test.com')
  })

  it('should throw when getting profile of non-existent user', async () => {
    mockRepo.findOne.mockResolvedValue(null)
    await expect(service.getProfile('999')).rejects.toThrow()
  })
})
