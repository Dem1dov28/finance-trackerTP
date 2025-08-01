import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateTransactionDto,
  GetTransactionsFilterDto,
  UpdateTransactionDto,
} from './transactions.dto';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.transactionsService.create(req.user.id, createTransactionDto);
  }

  @Get()
  findAll(
    @Query() filters: GetTransactionsFilterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.transactionsService.findAll(req.user.id, filters);
  }

  @Get('stats')
  getStats(@Req() req: RequestWithUser) {
    return this.transactionsService.getStatistics(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.transactionsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.transactionsService.update(
      req.user.id,
      id,
      updateTransactionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.transactionsService.remove(req.user.id, id);
  }
}
