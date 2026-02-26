import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as AdmZip from 'adm-zip';
import { Game, GameDocument } from './schemas/game.schema';
import { UploadGameDto } from './dto/upload-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { CategoriesService } from '../categories/categories.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class GamesService {
    private readonly tempDir = path.join(process.cwd(), 'uploads', 'temp');
    private readonly maxFileSize = 50 * 1024 * 1024; // 50MB

    constructor(
        @InjectModel(Game.name) private gameModel: Model<GameDocument>,
        private readonly categoriesService: CategoriesService,
        private readonly cloudinaryService: CloudinaryService,
    ) {
        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async uploadGame(
        file: Express.Multer.File,
        uploadGameDto: UploadGameDto,
        userId: string,
        thumbnailFile?: Express.Multer.File,
    ) {
        // Validate file exists
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Validate file size
        if (file.size > this.maxFileSize) {
            throw new BadRequestException('File size exceeds 50MB limit');
        }

        // Validate file type
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.html' && ext !== '.zip') {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw new BadRequestException('Only .html and .zip files are allowed');
        }

        // Generate slug from title
        const slug = this.generateSlug(uploadGameDto.title);

        // Check if slug already exists
        const existingGame = await this.gameModel.findOne({ slug });
        if (existingGame) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw new BadRequestException('A game with this title already exists');
        }

        let gamePlayUrl: string;
        let entryFile: string;
        let cloudinaryPublicIds: string[] = [];
        const fileType = ext === '.zip' ? 'zip' : 'html';

        try {
            if (fileType === 'zip') {
                // Extract ZIP to a temp directory
                const gameDir = path.join(this.tempDir, slug);
                if (!fs.existsSync(gameDir)) {
                    fs.mkdirSync(gameDir, { recursive: true });
                }

                const zip = new AdmZip(file.path);
                zip.extractAllTo(gameDir, true);

                // Find entry file (index.html)
                const foundEntry = this.findEntryFile(gameDir);
                if (!foundEntry) {
                    fs.rmSync(gameDir, { recursive: true, force: true });
                    throw new BadRequestException('ZIP must contain an index.html file');
                }
                entryFile = foundEntry;

                // Upload all files to Cloudinary
                const result = await this.cloudinaryService.uploadGameFolder(gameDir, slug, entryFile);
                gamePlayUrl = result.entryUrl;
                cloudinaryPublicIds = result.publicIds;

                // Clean up temp zip
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } else {
                // Single HTML file → upload to Cloudinary
                const result = await this.cloudinaryService.uploadHtmlFile(file.path, slug);
                gamePlayUrl = result.url;
                cloudinaryPublicIds = [result.publicId];
                entryFile = 'index.html';
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to process uploaded file: ' + error.message);
        }

        // Handle thumbnail → upload to Cloudinary
        let thumbnailUrl = '';
        let thumbnailPublicId = '';
        if (thumbnailFile) {
            const thumbResult = await this.cloudinaryService.uploadThumbnail(thumbnailFile.path, slug);
            thumbnailUrl = thumbResult.url;
            thumbnailPublicId = thumbResult.publicId;
        }

        // Create game record in database
        const game = await this.gameModel.create({
            title: uploadGameDto.title,
            description: uploadGameDto.description || '',
            category: uploadGameDto.category,
            slug,
            genre: uploadGameDto.genre,
            uploadedBy: new Types.ObjectId(userId),
            filePath: gamePlayUrl,  // Now stores Cloudinary URL
            entryFile,
            fileType,
            fileSize: file.size,
            thumbnailUrl,           // Now stores full Cloudinary URL
            thumbnailPublicId,
            cloudinaryPublicIds,
            isVisible: false,
        });

        return {
            message: 'Game uploaded successfully',
            game: {
                id: game._id,
                title: game.title,
                description: game.description,
                slug: game.slug,
                fileType: game.fileType,
                fileSize: game.fileSize,
                thumbnailUrl: game.thumbnailUrl,
                isVisible: game.isVisible,
                playUrl: `/games/${game._id}/play`,
                createdAt: (game as any).createdAt,
            },
        };
    }

    // Public listing — only visible games
    async findAll(page = 1, limit = 20, category?: string, search?: string, genre?: string, sortBy?: string) {
        const skip = (page - 1) * limit;

        const query: any = { isVisible: true };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (genre) {
            query.genre = genre;
        }

        let sortOption: any = { createdAt: -1 }; // default sorting
        if (sortBy === 'mostPlayed') {
            sortOption = { playCount: -1 };
        } else if (sortBy === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sortBy === 'topRated') {
            sortOption = { rating: -1 };
        }

        const [games, total] = await Promise.all([
            this.gameModel
                .find(query)
                .populate('uploadedBy', 'username')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .select('-filePath -entryFile -cloudinaryPublicIds -thumbnailPublicId'),
            this.gameModel.countDocuments(query),
        ]);


        return {
            games,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }


    // Admin listing — all games regardless of visibility
    async findAllAdmin(page = 1, limit = 100) {
        const skip = (page - 1) * limit;

        const [games, total] = await Promise.all([
            this.gameModel
                .find()
                .populate('uploadedBy', 'username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-filePath -entryFile -cloudinaryPublicIds -thumbnailPublicId'),
            this.gameModel.countDocuments(),
        ]);

        return {
            games,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async incrementPlayCount(id: string) {
        const game = await this.gameModel.findByIdAndUpdate(
            id,
            { $inc: { playCount: 1 } },
            { new: true }
        ).exec();

        // Also increment the category's play count
        if (game?.category) {
            await this.categoriesService.incrementPlayCount(game.category);
        }

        return game;
    }
    async findOne(id: string) {
        const game = await this.gameModel
            .findById(id)
            .populate('uploadedBy', 'username');

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        return {
            id: game._id,
            title: game.title,
            description: game.description,
            slug: game.slug,
            uploadedBy: game.uploadedBy,
            fileType: game.fileType,
            fileSize: game.fileSize,
            thumbnailUrl: game.thumbnailUrl,
            isVisible: game.isVisible,
            playUrl: `/games/${game._id}/play`,
            createdAt: (game as any).createdAt,
        };
    }

    async getGamePlayUrl(id: string): Promise<string> {
        const game = await this.gameModel.findById(id);
        if (!game) {
            throw new NotFoundException('Game not found');
        }

        // filePath now stores the Cloudinary URL
        return game.filePath;
    }

    async updateGame(
        id: string,
        updateGameDto: UpdateGameDto,
        thumbnailFile?: Express.Multer.File,
    ) {
        const game = await this.gameModel.findById(id);
        if (!game) {
            throw new NotFoundException('Game not found');
        }

        // Update fields
        if (updateGameDto.title !== undefined) {
            game.title = updateGameDto.title;
            game.slug = this.generateSlug(updateGameDto.title);
        }

        if (updateGameDto.description !== undefined) {
            game.description = updateGameDto.description;
        }
        if (updateGameDto.genre !== undefined) {
            game.genre = updateGameDto.genre;
        }
        if (updateGameDto.isVisible !== undefined) {
            game.isVisible = updateGameDto.isVisible;
        }
        if (updateGameDto.category !== undefined) {
            game.category = updateGameDto.category;
        }


        // Handle thumbnail update via Cloudinary
        if (thumbnailFile) {
            // Delete old thumbnail from Cloudinary
            if (game.thumbnailPublicId) {
                await this.cloudinaryService.deleteByPublicId(game.thumbnailPublicId, 'image');
            }

            const thumbResult = await this.cloudinaryService.uploadThumbnail(
                thumbnailFile.path,
                game.slug,
            );
            game.thumbnailUrl = thumbResult.url;
            game.thumbnailPublicId = thumbResult.publicId;
        }

        await game.save();

        return {
            message: 'Game updated successfully',
            game: {
                id: game._id,
                title: game.title,
                description: game.description,
                isVisible: game.isVisible,
                thumbnailUrl: game.thumbnailUrl,
            },
        };

    }


    async toggleVisibility(id: string) {
        const game = await this.gameModel.findById(id);
        if (!game) throw new NotFoundException('Game not found');

        game.isVisible = !game.isVisible;
        await game.save();

        return {
            message: `Game is now ${game.isVisible ? 'visible' : 'hidden'}`,
            isVisible: game.isVisible,
        };
    }

    async toggleFeatured(id: string) {
        const game = await this.gameModel.findById(id);
        if (!game) throw new NotFoundException('Game not found');

        game.isFeatured = !game.isFeatured;
        await game.save();

        return {
            message: `Game is now ${game.isFeatured ? 'featured' : 'normal'}`,
            isFeatured: game.isFeatured,
        };
    }

    async findFeatured() {
        return this.gameModel
            .find({ isVisible: true, isFeatured: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('-filePath -entryFile -cloudinaryPublicIds -thumbnailPublicId');
    }

    async deleteGame(id: string, userId: string, role: string) {
        const game = await this.gameModel.findById(id);
        if (!game) {
            throw new NotFoundException('Game not found');
        }

        // Check ownership or admin
        const isOwner = game.uploadedBy.toString() === userId.toString();
        const isAdmin = role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('You can only delete your own games');
        }

        // Delete game files from Cloudinary
        if (game.cloudinaryPublicIds && game.cloudinaryPublicIds.length > 0) {
            await this.cloudinaryService.deleteMultiple(game.cloudinaryPublicIds, 'raw');
        }
        // Also try to delete the game folder
        await this.cloudinaryService.deleteFolder(`peanut-butter/games/${game.slug}`);

        // Delete thumbnail from Cloudinary
        if (game.thumbnailPublicId) {
            await this.cloudinaryService.deleteByPublicId(game.thumbnailPublicId, 'image');
        }

        // Delete from database
        await this.gameModel.findByIdAndDelete(id);

        return { message: 'Game deleted successfully' };
    }
    async countByCategory() {
        const result = await this.gameModel.aggregate([
            {
                $match: { isVisible: true } // นับเฉพาะเกมที่แสดง
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        return result;
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    private findEntryFile(dir: string): string | null {
        // Look for index.html at root level first
        if (fs.existsSync(path.join(dir, 'index.html'))) {
            return 'index.html';
        }

        // Check one level deep in subdirectories
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subIndex = path.join(entry.name, 'index.html');
                if (fs.existsSync(path.join(dir, subIndex))) {
                    return subIndex;
                }
            }
        }

        // Look for any .html file at root
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.html')) {
                return entry.name;
            }
        }

        return null;
    }
    async adminStats() {
        const total = await this.gameModel.countDocuments();
        const visible = await this.gameModel.countDocuments({ isVisible: true });
        const featured = await this.gameModel.countDocuments({ isFeatured: true });

        const sizeAgg = await this.gameModel.aggregate([
            { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
        ]);

        return {
            total,
            visible,
            featured,
            totalSize: sizeAgg[0]?.totalSize || 0,
        };
    }

}
