import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    // ================= PUBLIC: LIST ALL =================
    @Get()
    findAll() {
        return this.categoriesService.findAll();
    }

    // ================= PUBLIC: GET ONE =================
    @Get('stats')
    getStats() {
        return this.categoriesService.getStats();
    }

    // ================= PUBLIC: GET ONE =================
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    // ================= ADMIN: CREATE =================
    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    // ================= ADMIN: UPDATE =================
    @Patch(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    // ================= ADMIN: DELETE =================
    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }
}
