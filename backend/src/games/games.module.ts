import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { Game, GameSchema } from './schemas/game.schema';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
        AuthModule,
        CategoriesModule,
    ],
    controllers: [GamesController],
    providers: [GamesService],
    exports: [GamesService],
})
export class GamesModule { }

