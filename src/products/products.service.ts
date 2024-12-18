import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected.');
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const response = await this.product.create({
        data: createProductDto,
      });

      return {
        existError: false,
        message: 'Product created successfully',
        data: response,
      };
    } catch {
      throw new RpcException('An error occurred while performing this process');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const totalProducts = await this.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalProducts / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true },
      }),
      meta: {
        page,
        total: totalProducts,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const productDB = await this.product.findFirst({
      where: { id, available: true },
    });

    if (!productDB) {
      throw new RpcException({
        message: `Product with id: ${id} not found.`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return productDB;
  }

  async update(updateProductDto: UpdateProductDto) {
    const { id, ...data } = updateProductDto;
    await this.findOne(id);
    return this.product.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.product.update({
      where: { id },
      data: { available: false },
    });

    return {
      existError: false,
      message: `Product with id: ${id} was deleted successfully.`,
    };
  }

  async validateProducts(ids: string[]) {
    ids = Array.from(new Set(ids));
    const productsDB = await this.product.findMany({
      where: { id: { in: ids } },
    });

    if (productsDB.length !== ids.length) {
      throw new RpcException({
        message: 'Some products were not found',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return productsDB;
  }
}
