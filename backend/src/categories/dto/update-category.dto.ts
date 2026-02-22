import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    @MaxLength(50)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    description?: string;
}
