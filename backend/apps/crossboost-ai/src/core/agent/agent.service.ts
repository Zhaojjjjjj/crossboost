import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { AgentRuntimeService } from './services/agent-runtime.service'

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
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

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name)
  private readonly tasks = new Map<string, AgentTask>()

  constructor(private readonly runtime: AgentRuntimeService) {}

  /**
   * Create and start a new agent task.
   */
  async createTask(options: CreateAgentTaskOptions): Promise<AgentTask> {
    const task: AgentTask = {
      id: randomUUID(),
      skill: options.skill,
      status: 'pending',
      input: options.input,
      userId: options.userId,
      orgId: options.orgId,
      progress: 0,
      logs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.tasks.set(task.id, task)
    this.logger.log(`Agent task created: ${task.id} (skill=${options.skill})`)

    // Execute asynchronously
    this.executeTask(task).catch((error) => {
      this.logger.error(`Agent task failed: ${task.id}`, error)
    })

    return task
  }

  /**
   * Get the current state of an agent task.
   */
  getTask(taskId: string): AgentTask {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new NotFoundException(`Agent task not found: ${taskId}`)
    }
    return task
  }

  /**
   * List tasks for a user/org with optional filters.
   */
  listTasks(filters: {
    userId?: string
    orgId?: string
    status?: AgentStatus
    skill?: AgentSkill
    limit?: number
    offset?: number
  }): { tasks: AgentTask[]; total: number } {
    let tasks = Array.from(this.tasks.values())

    if (filters.userId) {
      tasks = tasks.filter((t) => t.userId === filters.userId)
    }
    if (filters.orgId) {
      tasks = tasks.filter((t) => t.orgId === filters.orgId)
    }
    if (filters.status) {
      tasks = tasks.filter((t) => t.status === filters.status)
    }
    if (filters.skill) {
      tasks = tasks.filter((t) => t.skill === filters.skill)
    }

    tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const offset = filters.offset ?? 0
    const limit = filters.limit ?? 20

    return {
      tasks: tasks.slice(offset, offset + limit),
      total: tasks.length,
    }
  }

  /**
   * Cancel a running or pending agent task.
   */
  async cancelTask(taskId: string): Promise<AgentTask> {
    const task = this.getTask(taskId)

    if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      throw new Error(`Cannot cancel task in status: ${task.status}`)
    }

    task.status = 'cancelled'
    task.updatedAt = new Date()
    task.completedAt = new Date()
    this.addLog(task, 'info', 'Task cancelled by user')

    this.logger.log(`Agent task cancelled: ${taskId}`)
    return task
  }

  /**
   * Create an async generator that streams task events for SSE.
   */
  async *streamTask(taskId: string): AsyncGenerator<AgentStreamEvent, void, undefined> {
    const task = this.getTask(taskId)
    let lastLogIndex = 0

    // Yield existing state
    yield { type: 'progress', taskId, data: { progress: task.progress, status: task.status } }

    // Poll for updates
    while (task.status === 'pending' || task.status === 'running') {
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Yield new logs
      while (lastLogIndex < task.logs.length) {
        yield { type: 'log', taskId, data: task.logs[lastLogIndex] }
        lastLogIndex++
      }

      // Yield progress
      yield { type: 'progress', taskId, data: { progress: task.progress, status: task.status } }

      // Check for output
      if (task.output) {
        yield { type: 'output', taskId, data: task.output }
      }
    }

    // Final event
    if (task.status === 'completed') {
      yield { type: 'complete', taskId, data: task.output }
    } else if (task.status === 'failed') {
      yield { type: 'error', taskId, data: { error: task.error } }
    }
  }

  private async executeTask(task: AgentTask): Promise<void> {
    task.status = 'running'
    task.startedAt = new Date()
    task.updatedAt = new Date()
    this.addLog(task, 'info', `Task started: executing skill "${task.skill}"`)

    try {
      const result = await this.runtime.executeSkill(task.skill, task.input, {
        onProgress: (progress, message) => {
          task.progress = progress
          task.updatedAt = new Date()
          if (message) {
            this.addLog(task, 'info', message)
          }
        },
        onLog: (level, message, data) => {
          this.addLog(task, level, message, data)
        },
      })

      task.output = result
      task.status = 'completed'
      task.progress = 100
      task.completedAt = new Date()
      task.updatedAt = new Date()
      this.addLog(task, 'info', 'Task completed successfully')
    } catch (error) {
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : String(error)
      task.completedAt = new Date()
      task.updatedAt = new Date()
      this.addLog(task, 'error', `Task failed: ${task.error}`)
    }
  }

  private addLog(
    task: AgentTask,
    level: AgentLogEntry['level'],
    message: string,
    data?: Record<string, unknown>,
  ): void {
    task.logs.push({
      timestamp: new Date(),
      level,
      message,
      data,
    })
  }
}
