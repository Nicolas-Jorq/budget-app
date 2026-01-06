import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { config } from '../config/index.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('auth-service')

export interface RegisterInput {
  email: string
  name: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export const authService = {
  async register({ email, name, password }: RegisterInput) {
    logger.info('Registration attempt', { email })

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      logger.warn('Registration failed - email exists', { email })
      throw new Error('Email already registered')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    })

    logger.info('User registered successfully', { userId: user.id, email })
    return { user, token }
  },

  async login({ email, password }: LoginInput) {
    logger.info('Login attempt', { email })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      logger.warn('Login failed - user not found', { email })
      throw new Error('Invalid credentials')
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      logger.warn('Login failed - invalid password', { email, userId: user.id })
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    })

    logger.info('User logged in successfully', { userId: user.id, email })
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    }
  },

  async getUser(userId: string) {
    logger.debug('Fetching user', { userId })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })
    return user
  },
}
