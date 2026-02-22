import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name)
        private categoryModel: Model<CategoryDocument>,
    ) { }

    // ================= CREATE =================
    async create(createCategoryDto: CreateCategoryDto) {
        const exists = await this.categoryModel
            .findOne({ name: createCategoryDto.name })
            .exec();

        if (exists) {
            throw new ConflictException(
                `Category "${createCategoryDto.name}" already exists`,
            );
        }

        const category = new this.categoryModel(createCategoryDto);
        return category.save();
    }

    // ================= READ ALL =================
    async findAll() {
        return this.categoryModel.find().sort({ name: 1 }).exec();
    }

    // ================= READ ONE =================
    async findOne(id: string) {
        const category = await this.categoryModel.findById(id).exec();
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return category;
    }

    // ================= UPDATE =================
    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        // Check for name conflict if changing name
        if (updateCategoryDto.name) {
            const existing = await this.categoryModel
                .findOne({ name: updateCategoryDto.name, _id: { $ne: id } })
                .exec();
            if (existing) {
                throw new ConflictException(
                    `Category "${updateCategoryDto.name}" already exists`,
                );
            }
        }

        const category = await this.categoryModel
            .findByIdAndUpdate(id, updateCategoryDto, { new: true })
            .exec();

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    // ================= DELETE =================
    async remove(id: string) {
        const category = await this.categoryModel.findByIdAndDelete(id).exec();
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return { message: `Category "${category.name}" deleted` };
    }

    // ================= INCREMENT PLAY COUNT =================
    async incrementPlayCount(categoryName: string) {
        return this.categoryModel.findOneAndUpdate(
            { name: categoryName },
            { $inc: { playCount: 1 } },
            { new: true },
        ).exec();
    }

    // ================= STATS =================
    async getStats() {
        const categories = await this.categoryModel
            .find()
            .sort({ playCount: -1 })
            .exec();

        const totalPlays = categories.reduce(
            (sum, cat) => sum + (cat.playCount || 0),
            0,
        );

        return {
            total: categories.length,
            totalPlays,
            categories,
        };
    }
}
