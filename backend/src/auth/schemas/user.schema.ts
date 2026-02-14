import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, index: true, trim: true })
    username: string;

    @Prop({ required: true, unique: true, index: true, trim: true, lowercase: true })
    email: string;

    @Prop({ required: true })
    password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound index for login queries
UserSchema.index({ email: 1, password: 1 });
