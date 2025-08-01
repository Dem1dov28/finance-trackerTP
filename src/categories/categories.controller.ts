import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Req } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: RequestWithUser,
  ) {
    console.log('User ID:', req.user.id);
    if (!req.user?.id) {
      throw new BadRequestException('User ID is missing in request');
    }
    return this.categoriesService.create(req.user.id, createCategoryDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.categoriesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.categoriesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.categoriesService.update(req.user.id, id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.categoriesService.remove(req.user.id, id);
  }
}
