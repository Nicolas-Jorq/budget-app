import { prisma } from '../lib/prisma.js'
import { AccountType } from '@prisma/client'

export interface CreateBankAccountData {
  name: string
  bankName: string
  accountType: AccountType
  lastFour?: string
}

export interface UpdateBankAccountData {
  name?: string
  bankName?: string
  accountType?: AccountType
  lastFour?: string
  isActive?: boolean
}

export const bankAccountService = {
  async getAll(userId: string) {
    return prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { documents: true }
        }
      }
    })
  },

  async getById(id: string, userId: string) {
    return prisma.bankAccount.findFirst({
      where: { id, userId },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' },
          take: 5
        },
        _count: {
          select: { documents: true }
        }
      }
    })
  },

  async create(userId: string, data: CreateBankAccountData) {
    return prisma.bankAccount.create({
      data: {
        ...data,
        userId
      }
    })
  },

  async update(id: string, userId: string, data: UpdateBankAccountData) {
    // Verify ownership
    const existing = await prisma.bankAccount.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      throw new Error('Bank account not found')
    }

    return prisma.bankAccount.update({
      where: { id },
      data
    })
  },

  async delete(id: string, userId: string) {
    // Verify ownership
    const existing = await prisma.bankAccount.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      throw new Error('Bank account not found')
    }

    return prisma.bankAccount.delete({
      where: { id }
    })
  }
}
