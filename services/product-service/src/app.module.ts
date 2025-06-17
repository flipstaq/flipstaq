import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { FavoriteModule } from './favorite/favorite.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [ProductModule, FavoriteModule, ReviewModule],
})
export class AppModule {}
