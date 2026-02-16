import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class UpdateGameDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    title?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsString()
    @IsOptional()
    genre?: string;

    @IsBoolean()
    @IsOptional()
    isVisible?: boolean;
}
