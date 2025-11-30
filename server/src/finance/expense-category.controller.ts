import { Body, Controller, Get, Post } from '@nestjs/common';
import { ExpenseCategoryService } from './expense-category.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';

@Controller('expense')
export class ExpenseCategoryController {
  constructor(private readonly service: ExpenseCategoryService) {}

  @Post('category')
  async create(@Body() dto: CreateExpenseCategoryDto) {
    return this.service.create(dto);
  }

  @Get('categories')
  async findAll() {
    return this.service.findAll();
  }
}
