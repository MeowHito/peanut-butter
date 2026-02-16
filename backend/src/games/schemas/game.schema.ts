import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

    @Prop({ default: 0 })
    playCount: number;

    @Prop({ trim: true, index: true }) 
    genre: string;

    @Prop({ default: 0, index: true })
    rating: number;
    
}

export const GameSchema = SchemaFactory.createForClass(Game);

// Index for listing games sorted by creation date
GameSchema.index({ createdAt: -1 });

// Compound index for user's games
GameSchema.index({ uploadedBy: 1, createdAt: -1 });

// Index สำหรับการค้นหาด้วยชื่อเกม (Text Search)
GameSchema.index({ title: 'text' });

// Index สำหรับการกรองตามหมวดหมู่และเรียงตามยอดเล่น
GameSchema.index({ genre: 1, playCount: -1 });
