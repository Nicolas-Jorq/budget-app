import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { config } from './config/index.js'
import routes from './routes/index.js'
import logger from './lib/logger.js'
import { requestLogger } from './middleware/requestLogger.js'

dotenv.config({ path: '../.env' })

const app = express()

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}))
app.use(express.json())
app.use(requestLogger)

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

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ message: 'Internal server error' })
})

// Start server
app.listen(config.port, () => {
  logger.info(`Server started`, { port: config.port, env: config.nodeEnv })
})

export default app
