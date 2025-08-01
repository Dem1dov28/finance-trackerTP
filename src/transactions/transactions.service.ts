import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateTransactionDto,
  GetTransactionsFilterDto,
} from './transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const category = await this.prismaService.category.findUnique({
      where: { id: createTransactionDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('Нет доступа к этой категории');
    }

    return this.prismaService.transaction.create({
      data: {
        ...createTransactionDto,
        type: category.type,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            icon: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, filters: GetTransactionsFilterDto = {}) {
    const { categoryId, type, startDate, endDate } = filters;

    return this.prismaService.transaction.findMany({
      where: {
        userId,
        categoryId,
        type,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      orderBy: { date: 'desc' },
      include: {
        category: true,
      },
    });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Транзакция не найдена');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Нет доступа к этой транзакции');
    }

    return transaction;
  }

  async update(userId: string, id: string, updateTransactionDto) {
    const transaction = await this.findOne(userId, id);

    if (updateTransactionDto.categoryId) {
      const category = await this.prismaService.category.findUnique({
        where: { id: updateTransactionDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Категория не найдена');
      }

      if (category.userId !== userId) {
        throw new ForbiddenException('Нет доступа к этой категории');
      }

      updateTransactionDto.type = category.type;
    }

    return this.prismaService.transaction.update({
      where: { id },
      data: updateTransactionDto,
      include: {
        category: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prismaService.transaction.delete({
      where: { id },
    });
  }

  async getStatistics(userId: string) {
    const transactions = await this.prismaService.transaction.findMany({
      where: { userId },
      include: { category: true },
    });

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    const categoriesStats = await this.prismaService.category.findMany({
      where: { userId },
      include: {
        transactions: {
          select: { amount: true },
        },
      },
    });

    const categories = categoriesStats.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
      total: category.transactions.reduce((sum, t) => sum + t.amount, 0),
    }));

    return {
      balance,
      income,
      expense,
      categories,
    };
  }
}
