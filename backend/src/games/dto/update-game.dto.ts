import { IsOptional, IsString, IsBoolean, MaxLength, IsEnum } from 'class-validator';
import { GameCategory } from '../schemas/game.schema';

export class UpdateGameDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    title?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsBoolean()
    @IsOptional()
    isVisible?: boolean;

    @IsEnum(GameCategory)
    @IsOptional()
    category?: GameCategory;
}
