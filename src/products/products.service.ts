import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
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
      throw new InternalServerErrorException(
        'An error occurred while performing this process',
      );
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
      throw new NotFoundException(`Product with id: ${id} not found.`);
    }

    return productDB;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    return this.product.update({ where: { id }, data: updateProductDto });
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
}
