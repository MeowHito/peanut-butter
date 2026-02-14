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
                limits: {
                    fileSize: 50 * 1024 * 1024, // 50MB
                },
            },
        ),
    )
    async uploadGame(
        @UploadedFiles() files: { gameFile?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
        @Body() uploadGameDto: UploadGameDto,
        @Request() req,
    ) {
        const gameFile = files.gameFile?.[0];
        const thumbnailFile = files.thumbnail?.[0];
        return this.gamesService.uploadGame(gameFile!, uploadGameDto, req.user._id, thumbnailFile);
    }

    // Public listing — only visible games
    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.gamesService.findAll(page, limit);
    }

    // Admin listing — all games
    @Get('admin/all')
    @UseGuards(JwtAuthGuard)
    async findAllAdmin(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    ) {
        return this.gamesService.findAllAdmin(page, limit);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.gamesService.findOne(id);
    }

    @Get(':id/play')
    async playGame(@Param('id') id: string, @Res() res: Response) {
        const filePath = await this.gamesService.getGamePlayPath(id);
        return res.sendFile(filePath);
    }

    // Update game details (admin)
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('thumbnail', {
            storage: multerStorage,
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB for thumbnail
            },
        }),
    )
    async updateGame(
        @Param('id') id: string,
        @UploadedFile() thumbnailFile: Express.Multer.File,
        @Body() updateGameDto: UpdateGameDto,
    ) {
        return this.gamesService.updateGame(id, updateGameDto, thumbnailFile);
    }

    // Toggle visibility (admin)
    @Patch(':id/visibility')
    @UseGuards(JwtAuthGuard)
    async toggleVisibility(@Param('id') id: string) {
        return this.gamesService.toggleVisibility(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteGame(@Param('id') id: string, @Request() req) {
        return this.gamesService.deleteGame(id, req.user._id);
    }
}
