import { IsInt, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class UpdateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsString()
  @IsNotEmpty()
  comment?: string;
}
