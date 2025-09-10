import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
// Usa la ruta relativa si no tienes alias/índice:
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  create(dto: CreateProductDto) {
    return this.product.create({ data: dto });
  }

  async findAll(paginationDto: PaginationDto) {
    // valores por defecto para evitar “possibly undefined”
    const { page = 1, limit = 10 } = paginationDto ?? {};

    const total = await this.product.count({ where: { available: true } });
    const lastPage = Math.max(1, Math.ceil(total / limit));

    const data = await this.product.findMany({
      where: { available: true },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, lastPage, limit },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id, available: true },
    });
    if (!product) throw new NotFoundException(`Product with id #${id} not found`);
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id); // valida existencia
    return this.product.update({
      where: { id },
      data: dto, // ya no intentes extraer id del DTO
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.product.update({
      where: { id },
      data: { available: false },
    });
  }
}
