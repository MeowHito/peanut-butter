import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    description?: string;
}
