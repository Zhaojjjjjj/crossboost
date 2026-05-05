import mysql from 'mysql2/promise'

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = Number(process.env.DB_PORT) || 3306
const DB_USERNAME = process.env.DB_USERNAME || 'crossboost'
const DB_PASSWORD = process.env.DB_PASSWORD || 'crossboost123'
const DB_DATABASE = process.env.DB_DATABASE || 'crossboost'

async function main() {
  console.log('Initializing CrossBoost database...')

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    multipleStatements: true,
  })

  // Create database if not exists
  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await connection.execute(`USE \`${DB_DATABASE}\``)

  // Tables are auto-created by TypeORM synchronize:true
  // This init script just ensures the database exists

  await connection.end()
  console.log('Database initialization complete!')
}

main().catch((err) => {
  console.error('Init failed:', err)
  process.exit(1)
})
