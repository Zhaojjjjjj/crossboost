import { MongoClient } from 'mongodb'
import { randomBytes } from 'crypto'
import { writeFileSync } from 'fs'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@mongodb:27017'
const DB_NAME = process.env.DB_NAME || 'crossboost'
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-jwt-secret'
const AUTO_LOGIN_TOKEN_PATH = process.env.AUTO_LOGIN_TOKEN_PATH || '/data/init/token.txt'

async function main() {
  console.log('Initializing CrossBoost database...')

  const client = new MongoClient(MONGO_URI)
  await client.connect()
  const db = client.db(DB_NAME)

  // Create collections
  const collections = [
    'users', 'accounts', 'products', 'content-tasks',
    'publish-records', 'analytics-records', 'credits-balances',
    'credits-records', 'notifications', 'oauth2-credentials',
    'api-keys', 'assets', 'materials',
  ]

  for (const name of collections) {
    try {
      await db.createCollection(name)
      console.log(`  Created collection: ${name}`)
    } catch (e) {
      if (e.codeName === 'NamespaceExists') {
        console.log(`  Collection already exists: ${name}`)
      } else {
        throw e
      }
    }
  }

  // Create indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  await db.collection('products').createIndex({ userId: 1, sku: 1 })
  await db.collection('publish-records').createIndex({ userId: 1, status: 1 })
  await db.collection('analytics-records').createIndex({ contentId: 1, platform: 1 })

  // Generate auto-login token
  const token = randomBytes(32).toString('hex')
  try {
    writeFileSync(AUTO_LOGIN_TOKEN_PATH, token)
    console.log(`  Auto-login token written to ${AUTO_LOGIN_TOKEN_PATH}`)
  } catch {
    console.log('  Could not write auto-login token (volume may not be mounted)')
  }

  await client.close()
  console.log('Database initialization complete!')
}

main().catch((err) => {
  console.error('Init failed:', err)
  process.exit(1)
})
