import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import { CreateSavedFilterDto } from './dto/create-saved-filter.dto';

@Injectable()
export class SavedFiltersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateSavedFilterDto) {
    try {
      return await this.prisma.savedFilter.create({
        data: {
          tenantId,
          userId,
          name: dto.name,
          feature: dto.feature,
          filters: dto.filters,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          `A saved filter named "${dto.name}" already exists for this feature.`,
        );
      }
      throw error;
    }
  }

  async findAll(tenantId: string, userId: string, feature: string) {
    return this.prisma.savedFilter.findMany({
      where: {
        tenantId,
        userId,
        feature,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.savedFilter.findFirst({
      where: {
        id,
        tenantId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Saved filter not found.');
    }

    await this.prisma.savedFilter.delete({
      where: {
        id,
      },
    });

    return { message: 'Saved filter deleted successfully.' };
  }
}
