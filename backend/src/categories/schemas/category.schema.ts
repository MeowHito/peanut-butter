import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true, versionKey: false })
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ default: 0 })
  playCount: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
