import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export enum GameCategory {
    ACTION = 'Action',
    ADVENTURE = 'Adventure',
    PUZZLE = 'Puzzle',
    ARCADE = 'Arcade',
    RPG = 'RPG',
}
export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {
    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ default: '', trim: true })
    description: string;

    @Prop({ required: true, unique: true, index: true, trim: true, lowercase: true })
    slug: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    uploadedBy: Types.ObjectId;

    @Prop({ required: true })
    filePath: string;

    @Prop({ required: true })
    entryFile: string;

    @Prop({ required: true, enum: ['html', 'zip'] })
    fileType: string;

    @Prop({ required: true })
    fileSize: number;

    @Prop({ default: '' })
    thumbnailUrl: string;

    @Prop({ default: false })
    isVisible: boolean;

    @Prop({ default: false, index: true })
    isFeatured: boolean;

    @Prop({
        required: true,
        enum: GameCategory,
        index: true,
    })
    category: GameCategory;

}

export const GameSchema = SchemaFactory.createForClass(Game);

// Index for listing games sorted by creation date
GameSchema.index({ createdAt: -1 });

// Compound index for user's games
GameSchema.index({ uploadedBy: 1, createdAt: -1 });
