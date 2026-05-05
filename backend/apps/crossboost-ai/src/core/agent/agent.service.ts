import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  ContentTask,
  ContentTaskType,
  ContentTaskStatus,
} from '@crossboost/database'
import { AgentRuntimeService } from './services/agent-runtime.service'

export type AgentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type AgentSkill =
  | 'generate-product-video'
  | 'generate-product-images'
  | 'write-listing-copy'
  | 'adapt-content'
  | 'analyze-performance'

export interface CreateAgentTaskOptions {
  skill: AgentSkill
  input: Record<string, unknown>
  userId: string
  orgId: string
  /** Callback URL for async notification */
  callbackUrl?: string
  /** Priority: higher = more urgent */
  priority?: number
}

export interface AgentTask {
  id: string
  skill: AgentSkill
  status: AgentStatus
  input: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  userId: string
  orgId: string
  progress: number
  logs: AgentLogEntry[]
  createdAt: Date
  updatedAt: Date
  startedAt?: Date
  completedAt?: Date
}

export interface AgentLogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: Record<string, unknown>
}

export interface AgentStreamEvent {
  type: 'progress' | 'log' | 'output' | 'error' | 'complete'
  taskId: string
  data: unknown
}

/** Maps AgentSkill to ContentTaskType */
const SKILL_TO_TYPE: Record<AgentSkill, ContentTaskType> = {
  'generate-product-video': ContentTaskType.VIDEO,
  'generate-product-images': ContentTaskType.IMAGE,
  'write-listing-copy': ContentTaskType.COPY,
  'adapt-content': ContentTaskType.ADAPTATION,
  'analyze-performance': ContentTaskType.COPY,
}

/** Maps ContentTaskStatus to AgentStatus */
function toAgentStatus(status: ContentTaskStatus): AgentStatus {
  switch (status) {
    case ContentTaskStatus.PENDING:
      return 'pending'
    case ContentTaskStatus.PROCESSING:
      return 'processing'
    case ContentTaskStatus.COMPLETED:
      return 'completed'
    case ContentTaskStatus.FAILED:
      return 'failed'
  }
}

/** Maps AgentStatus to ContentTaskStatus */
function toContentTaskStatus(status: AgentStatus): ContentTaskStatus {
  switch (status) {
    case 'pending':
      return ContentTaskStatus.PENDING
    case 'processing':
      return ContentTaskStatus.PROCESSING
    case 'completed':
      return ContentTaskStatus.COMPLETED
    case 'failed':
      return ContentTaskStatus.FAILED
    case 'cancelled':
      return ContentTaskStatus.FAILED
  }
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name)

  /** In-memory runtime state: progress and logs (not persisted to DB) */
  private readonly runtimeState = new Map<
    string,
    { progress: number; logs: AgentLogEntry[] }
  >()

  constructor(
    @InjectRepository(ContentTask)
    private readonly taskRepo: Repository<ContentTask>,
    private readonly runtime: AgentRuntimeService,
  ) {}

  /**
   * Create and start a new agent task.
   */
  async createTask(options: CreateAgentTaskOptions): Promise<AgentTask> {
    const entity = this.taskRepo.create({
      userId: options.userId,
      type: SKILL_TO_TYPE[options.skill],
      status: ContentTaskStatus.PENDING,
      input: {
        skill: options.skill,
        orgId: options.orgId,
        callbackUrl: options.callbackUrl,
        priority: options.priority,
        ...options.input,
      },
    })

    const saved = await this.taskRepo.save(entity)
    this.logger.log(`Agent task created: ${saved.id} (skill=${options.skill})`)

    // Initialize runtime state
    this.runtimeState.set(saved.id, { progress: 0, logs: [] })

    // Execute asynchronously
    this.executeTask(saved, options).catch((error) => {
      this.logger.error(`Agent task failed: ${saved.id}`, error)
    })

    return this.toAgentTask(saved)
  }

  /**
   * Get the current state of an agent task.
   */
  async getTask(taskId: string): Promise<AgentTask> {
    const entity = await this.taskRepo.findOne({ where: { id: taskId } })
    if (!entity) {
      throw new NotFoundException(`Agent task not found: ${taskId}`)
    }
    return this.toAgentTask(entity)
  }

  /**
   * List tasks for a user/org with optional filters.
   */
  async listTasks(filters: {
    userId?: string
    orgId?: string
    status?: AgentStatus
    skill?: AgentSkill
    limit?: number
    offset?: number
  }): Promise<{ tasks: AgentTask[]; total: number }> {
    const qb = this.taskRepo.createQueryBuilder('task')

    if (filters.userId) {
      qb.andWhere('task.user_id = :userId', { userId: filters.userId })
    }
    if (filters.status) {
      qb.andWhere('task.status = :status', {
        status: toContentTaskStatus(filters.status),
      })
    }
    if (filters.skill) {
      qb.andWhere('task.type = :type', {
        type: SKILL_TO_TYPE[filters.skill],
      })
    }

    qb.orderBy('task.created_at', 'DESC')

    const offset = filters.offset ?? 0
    const limit = filters.limit ?? 20
    qb.skip(offset).take(limit)

    const [entities, total] = await qb.getManyAndCount()

    return {
      tasks: entities.map((e) => this.toAgentTask(e)),
      total,
    }
  }

  /**
   * Cancel a running or pending agent task.
   */
  async cancelTask(taskId: string): Promise<AgentTask> {
    const entity = await this.taskRepo.findOne({ where: { id: taskId } })
    if (!entity) {
      throw new NotFoundException(`Agent task not found: ${taskId}`)
    }

    if (
      entity.status === ContentTaskStatus.COMPLETED ||
      entity.status === ContentTaskStatus.FAILED
    ) {
      throw new Error(`Cannot cancel task in status: ${entity.status}`)
    }

    entity.status = ContentTaskStatus.FAILED
    entity.error = 'Cancelled by user'
    await this.taskRepo.save(entity)

    const state = this.runtimeState.get(taskId)
    if (state) {
      state.progress = 0
      state.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Task cancelled by user',
      })
    }

    this.logger.log(`Agent task cancelled: ${taskId}`)
    return this.toAgentTask(entity)
  }

  /**
   * Create an async generator that streams task events for SSE.
   */
  async *streamTask(taskId: string): AsyncGenerator<AgentStreamEvent, void, undefined> {
    const entity = await this.taskRepo.findOne({ where: { id: taskId } })
    if (!entity) {
      throw new NotFoundException(`Agent task not found: ${taskId}`)
    }

    const state = this.runtimeState.get(taskId) ?? { progress: 0, logs: [] }
    let lastLogIndex = 0

    // Yield existing state
    yield {
      type: 'progress',
      taskId,
      data: { progress: state.progress, status: toAgentStatus(entity.status) },
    }

    // Poll for updates
    while (
      entity.status === ContentTaskStatus.PENDING ||
      entity.status === ContentTaskStatus.PROCESSING
    ) {
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Re-fetch from DB
      const fresh = await this.taskRepo.findOne({ where: { id: taskId } })
      if (fresh) {
        entity.status = fresh.status
        entity.result = fresh.result
        entity.error = fresh.error
      }

      // Yield new logs
      while (lastLogIndex < state.logs.length) {
        yield { type: 'log', taskId, data: state.logs[lastLogIndex] }
        lastLogIndex++
      }

      // Yield progress
      yield {
        type: 'progress',
        taskId,
        data: { progress: state.progress, status: toAgentStatus(entity.status) },
      }

      // Check for output
      if (entity.result) {
        yield { type: 'output', taskId, data: entity.result }
      }

      if (
        entity.status === ContentTaskStatus.COMPLETED ||
        entity.status === ContentTaskStatus.FAILED
      ) {
        break
      }
    }

    // Final event
    if (entity.status === ContentTaskStatus.COMPLETED) {
      yield { type: 'complete', taskId, data: entity.result }
    } else if (entity.status === ContentTaskStatus.FAILED) {
      yield { type: 'error', taskId, data: { error: entity.error } }
    }
  }

  private async executeTask(entity: ContentTask, options: CreateAgentTaskOptions): Promise<void> {
    const state = this.runtimeState.get(entity.id) ?? { progress: 0, logs: [] }

    entity.status = ContentTaskStatus.PROCESSING
    await this.taskRepo.save(entity)
    this.addLog(state, 'info', `Task started: executing skill "${options.skill}"`)

    try {
      const result = await this.runtime.executeSkill(options.skill, options.input, {
        onProgress: (progress, message) => {
          state.progress = progress
          if (message) {
            this.addLog(state, 'info', message)
          }
        },
        onLog: (level, message, data) => {
          this.addLog(state, level, message, data)
        },
      })

      entity.result = result
      entity.status = ContentTaskStatus.COMPLETED
      await this.taskRepo.save(entity)

      state.progress = 100
      this.addLog(state, 'info', 'Task completed successfully')
    } catch (error) {
      entity.status = ContentTaskStatus.FAILED
      entity.error = error instanceof Error ? error.message : String(error)
      await this.taskRepo.save(entity)

      this.addLog(state, 'error', `Task failed: ${entity.error}`)
    }
  }

  private addLog(
    state: { progress: number; logs: AgentLogEntry[] },
    level: AgentLogEntry['level'],
    message: string,
    data?: Record<string, unknown>,
  ): void {
    state.logs.push({
      timestamp: new Date(),
      level,
      message,
      data,
    })
  }

  private toAgentTask(entity: ContentTask): AgentTask {
    const input = (entity.input ?? {}) as Record<string, unknown>
    const { skill: rawSkill, orgId, ...restInput } = input as {
      skill?: string
      orgId?: string
      [key: string]: unknown
    }

    const skill = (rawSkill as AgentSkill) ?? 'write-listing-copy'
    const state = this.runtimeState.get(entity.id)

    return {
      id: entity.id,
      skill,
      status: toAgentStatus(entity.status),
      input: restInput,
      output: entity.result ?? undefined,
      error: entity.error ?? undefined,
      userId: entity.userId,
      orgId: (orgId as string) ?? '',
      progress: state?.progress ?? (entity.status === ContentTaskStatus.COMPLETED ? 100 : 0),
      logs: state?.logs ?? [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      startedAt: entity.status !== ContentTaskStatus.PENDING ? entity.createdAt : undefined,
      completedAt:
        entity.status === ContentTaskStatus.COMPLETED ||
        entity.status === ContentTaskStatus.FAILED
          ? entity.updatedAt
          : undefined,
    }
  }
}
