import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    // 1. Проверка наличия userId
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // 2. Проверка существования пользователя
    try {
      const userExists = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        throw new NotFoundException('User not found');
      }
    } catch (error) {
      throw new BadRequestException('Invalid user ID');
    }

    // 3. Создание категории
    return this.prismaService.category.create({
      data: {
        name: createCategoryDto.name,
        type: createCategoryDto.type,
        color: createCategoryDto.color,
        icon: createCategoryDto.icon,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prismaService.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('Нет доступа к этой категории');
    }

    return category;
  }

  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    await this.findOne(userId, id);

    return this.prismaService.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    const transactionsCount = await this.prismaService.transaction.count({
      where: { categoryId: id },
    });

    if (transactionsCount > 0) {
      throw new ForbiddenException(
        'Нельзя удалить категорию с привязанными транзакциями',
      );
    }

    return this.prismaService.category.delete({
      where: { id },
    });
  }
}
