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

@Injectable()
export class GamesService {
    private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'games');
    private readonly maxFileSize = 50 * 1024 * 1024; // 50MB

    constructor(
        @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    ) {
        // Ensure uploads directory exists
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    async uploadGame(
        file: Express.Multer.File,
        uploadGameDto: UploadGameDto,
        userId: string,
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
            // Clean up the uploaded temp file
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

        // Create game directory
        const gameDir = path.join(this.uploadsDir, slug);
        if (!fs.existsSync(gameDir)) {
            fs.mkdirSync(gameDir, { recursive: true });
        }

        let entryFile: string;
        const fileType = ext === '.zip' ? 'zip' : 'html';

        try {
            if (fileType === 'zip') {
                // Extract ZIP file
                const zip = new AdmZip(file.path);
                zip.extractAllTo(gameDir, true);

                // Find entry file (index.html)
                const foundEntry = this.findEntryFile(gameDir);
                if (!foundEntry) {
                    // Clean up
                    fs.rmSync(gameDir, { recursive: true, force: true });
                    throw new BadRequestException('ZIP must contain an index.html file');
                }
                entryFile = foundEntry;

                // Remove temp uploaded file
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } else {
                // Move HTML file to game directory
                const destPath = path.join(gameDir, 'index.html');
                fs.copyFileSync(file.path, destPath);
                fs.unlinkSync(file.path);
                entryFile = 'index.html';
            }
        } catch (error) {
            // Clean up on error
            if (fs.existsSync(gameDir)) {
                fs.rmSync(gameDir, { recursive: true, force: true });
            }
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to process uploaded file');
        }

        // Create game record in database
        const game = await this.gameModel.create({
            title: uploadGameDto.title,
            description: uploadGameDto.description || '',
            slug,
            uploadedBy: new Types.ObjectId(userId),
            filePath: gameDir,
            entryFile,
            fileType,
            fileSize: file.size,
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
                playUrl: `/games/${game._id}/play`,
                createdAt: (game as any).createdAt,
            },
        };
    }

    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [games, total] = await Promise.all([
            this.gameModel
                .find()
                .populate('uploadedBy', 'username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-filePath -entryFile'),
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
            playUrl: `/games/${game._id}/play`,
            createdAt: (game as any).createdAt,
        };
    }

    async getGamePlayPath(id: string): Promise<string> {
        const game = await this.gameModel.findById(id);
        if (!game) {
            throw new NotFoundException('Game not found');
        }

        const entryPath = path.join(game.filePath, game.entryFile);
        if (!fs.existsSync(entryPath)) {
            throw new NotFoundException('Game files not found');
        }

        return entryPath;
    }

    async deleteGame(id: string, userId: string) {
        const game = await this.gameModel.findById(id);
        if (!game) {
            throw new NotFoundException('Game not found');
        }

        // Check ownership
        if (game.uploadedBy.toString() !== userId.toString()) {
            throw new ForbiddenException('You can only delete your own games');
        }

        // Delete game files
        if (fs.existsSync(game.filePath)) {
            fs.rmSync(game.filePath, { recursive: true, force: true });
        }

        // Delete from database
        await this.gameModel.findByIdAndDelete(id);

        return { message: 'Game deleted successfully' };
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
}
