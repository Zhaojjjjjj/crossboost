import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface S3Config {
  region: string
  bucket: string
  endpoint?: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle?: boolean
  cdnDomain?: string
}

export interface UploadParams {
  key: string
  body: Buffer | Uint8Array | string | ReadableStream
  contentType?: string
  metadata?: Record<string, string>
  isPublic?: boolean
}

export interface SignedUrlOptions {
  expiresIn?: number
  contentType?: string
}

@Injectable()
export class S3Service implements OnModuleDestroy {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly cdnDomain?: string
  private readonly logger = new Logger(S3Service.name)

  constructor(@Inject('S3_CONFIG') config: S3Config) {
    this.bucket = config.bucket
    this.cdnDomain = config.cdnDomain

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async onModuleDestroy() {
    this.client.destroy()
  }

  /**
   * Upload a file to S3
   */
  async upload(params: UploadParams): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      Metadata: params.metadata,
      ACL: params.isPublic ? 'public-read' : undefined,
    })

    await this.client.send(command)
    this.logger.log(`Uploaded: ${params.key}`)
    return this.getUrl(params.key)
  }

  /**
   * Download a file from S3
   */
  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    const response = await this.client.send(command)
    const chunks: Uint8Array[] = []
    const stream = response.Body as any

    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }

  /**
   * Delete a file from S3
   */
  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await this.client.send(command)
    this.logger.log(`Deleted: ${key}`)
  }

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
      await this.client.send(command)
      return true
    } catch {
      return false
    }
  }

  /**
   * Copy a file within S3
   */
  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destinationKey,
    })

    await this.client.send(command)
    this.logger.log(`Copied: ${sourceKey} -> ${destinationKey}`)
  }

  /**
   * List files with a prefix
   */
  async list(prefix: string, maxKeys = 1000): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    })

    const response = await this.client.send(command)
    return (response.Contents || []).map((item) => item.Key!).filter(Boolean)
  }

  /**
   * Generate a presigned URL for uploading
   */
  async getPresignedUploadUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options?.contentType,
    })

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    })
  }

  /**
   * Generate a presigned URL for downloading
   */
  async getPresignedDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    })
  }

  /**
   * Get the public URL for a key
   */
  getUrl(key: string): string {
    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${key}`
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`
  }
}
