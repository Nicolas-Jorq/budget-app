import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { config } from './config/index.js'
import routes from './routes/index.js'

dotenv.config({ path: '../.env' })

const app = express()

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api', routes)

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Budget App API',
    version: '1.0.0',
    endpoints: {
      api: '/api',
      health: '/health',
    },
  })
})

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
})

export default app
