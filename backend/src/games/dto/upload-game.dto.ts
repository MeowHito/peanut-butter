import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadGameDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;
}
