import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Request,
    Res,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { GamesService } from './games.service';
import { UploadGameDto } from './dto/upload-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

const tempUploadDir = path.join(process.cwd(), 'uploads', 'temp');

const multerStorage = diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(tempUploadDir)) {
            fs.mkdirSync(tempUploadDir, { recursive: true });
        }
        cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

@Controller('games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) { }

    // ================= UPLOAD =================
    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'gameFile', maxCount: 1 },
                { name: 'thumbnail', maxCount: 1 },
            ],
            {
                storage: multerStorage,
                limits: { fileSize: 50 * 1024 * 1024 },
            },
        ),
    )
    async uploadGame(
        @UploadedFiles()
        files: { gameFile?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
        @Body() uploadGameDto: UploadGameDto,
        @Request() req,
    ) {
        const gameFile = files.gameFile?.[0];
        const thumbnailFile = files.thumbnail?.[0];
        return this.gamesService.uploadGame(gameFile!, uploadGameDto, req.user._id, thumbnailFile);
    }

    // ================= PUBLIC LIST =================
    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('category') category?: string,
        @Query('search') search?: string,
        @Query('genre') genre?: string,
        @Query('sortBy') sortBy?: string,
    ) {
        return this.gamesService.findAll(page, limit, category, search, genre, sortBy);
    }

    // ================= ADMIN LIST =================
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async findAllAdmin(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    ) {
        return this.gamesService.findAllAdmin(page, limit);
    }

    // ================= CATEGORY COUNT =================
    @Get('categories/count')
    async countByCategory() {
        return this.gamesService.countByCategory();
    }

    // ================= FEATURED (PUBLIC) =================
    @Get('featured')
    async findFeatured() {
        return this.gamesService.findFeatured();
    }

    // ================= ADMIN STATS =================
    @Get('admin/stats')
    @UseGuards(JwtAuthGuard, AdminGuard)
    adminStats() {
        return this.gamesService.adminStats();
    }

    // ================= GAME DETAIL =================
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.gamesService.findOne(id);
    }

    // ================= PLAY GAME =================
    @Get(':id/play')
    async playGame(@Param('id') id: string, @Res() res: Response) {
        await this.gamesService.incrementPlayCount(id);
        const playUrl = await this.gamesService.getGamePlayUrl(id);

        // Cloudinary raw uploads don't serve with text/html content-type,
        // so we proxy the content and serve it with the correct headers
        try {
            const response = await fetch(playUrl);
            const html = await response.text();
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);
        } catch {
            return res.redirect(playUrl);
        }
    }

    // ================= UPDATE (ADMIN) =================
    @Patch(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @UseInterceptors(
        FileInterceptor('thumbnail', {
            storage: multerStorage,
            limits: { fileSize: 5 * 1024 * 1024 },
        }),
    )
    async updateGame(
        @Param('id') id: string,
        @UploadedFile() thumbnailFile: Express.Multer.File,
        @Body() updateGameDto: UpdateGameDto,
    ) {
        return this.gamesService.updateGame(id, updateGameDto, thumbnailFile);
    }

    // ================= TOGGLE VISIBILITY (ADMIN) =================
    @Patch(':id/visibility')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async toggleVisibility(@Param('id') id: string) {
        return this.gamesService.toggleVisibility(id);
    }

    // ================= TOGGLE FEATURED (ADMIN) =================
    @Patch(':id/featured')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async toggleFeatured(@Param('id') id: string) {
        return this.gamesService.toggleFeatured(id);
    }

    // ================= DELETE (OWNER OR ADMIN) =================
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteGame(@Param('id') id: string, @Request() req) {
        return this.gamesService.deleteGame(
            id,
            req.user._id,
            req.user.role
        );

    }
}
