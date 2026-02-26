import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { CategorySchema } from './categories/schemas/category.schema';

async function seedCategories() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected DB');

        const Category = mongoose.model('Category', CategorySchema);

        const existing = await Category.countDocuments();
        if (existing > 0) {
            console.log(`Categories already exist (${existing} found). Skipping.`);
            await mongoose.disconnect();
            process.exit(0);
        }

        await Category.insertMany([
            { name: 'Action', description: 'Fast-paced games with combat and reflexes', playCount: 0 },
            { name: 'Puzzle', description: 'Brain teasers and logic challenges', playCount: 0 },
            { name: 'RPG', description: 'Role-playing games with story and progression', playCount: 0 },
            { name: 'Arcade', description: 'Classic arcade-style games', playCount: 0 },
            { name: 'Adventure', description: 'Exploration and story-driven games', playCount: 0 },
        ]);

        console.log('Categories seeded ✅');
    } catch (err) {
        console.error('Seed Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedCategories();
