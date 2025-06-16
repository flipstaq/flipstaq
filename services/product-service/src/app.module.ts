import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { FavoriteModule } from './favorite/favorite.module';

@Module({
  imports: [ProductModule, FavoriteModule],
})
export class AppModule {}
