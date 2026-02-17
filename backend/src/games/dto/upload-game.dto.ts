import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { GameCategory } from '../schemas/game.schema';

export class UploadGameDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsEnum(GameCategory)
    @IsNotEmpty()
    category: GameCategory;
}
