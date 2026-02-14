import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Request,
    Res,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import { GamesService } from './games.service';
import { UploadGameDto } from './dto/upload-game.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('gameFile', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
                    const fs = require('fs');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    cb(null, uploadDir);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, uniqueSuffix + path.extname(file.originalname));
                },
            }),
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB
            },
            fileFilter: (req, file, cb) => {
                const ext = path.extname(file.originalname).toLowerCase();
                if (ext !== '.html' && ext !== '.zip') {
                    return cb(new Error('Only .html and .zip files are allowed'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadGame(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadGameDto: UploadGameDto,
        @Request() req,
    ) {
        return this.gamesService.uploadGame(file, uploadGameDto, req.user._id);
    }

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.gamesService.findAll(page, limit);
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

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteGame(@Param('id') id: string, @Request() req) {
        return this.gamesService.deleteGame(id, req.user._id);
    }
}
