import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller()
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  @Post('expense')
  async create(@Body() dto: CreateExpenseDto) {
    return this.service.create(dto);
  }

  @Get('projects/:id/expenses')
  async getProjectExpenses(@Param('id') projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Get('expense/:id')
  async getExpense(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Delete('expense/:id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
