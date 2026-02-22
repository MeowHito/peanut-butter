import * as dotenv from 'dotenv';
dotenv.config(); // ต้องอยู่บนสุด

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

import { UserSchema } from './users/user.schema';
import { GameSchema } from './games/schemas/game.schema';
import { CategorySchema } from './categories/schemas/category.schema';

async function seed() {
  try {
    // ใช้ .env
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected DB');

    // สร้าง Model
    const User = mongoose.model('User', UserSchema);
    const Game = mongoose.model('Game', GameSchema);
    const Category = mongoose.model('Category', CategorySchema);

    // ลบข้อมูลเก่า
    await User.deleteMany({});
    await Game.deleteMany({});
    await Category.deleteMany({});

    // ================= CATEGORY =================
    const categories = await Category.insertMany([
      { name: 'Action', description: 'Fast-paced games with combat and reflexes', playCount: 0 },
      { name: 'Puzzle', description: 'Brain teasers and logic challenges', playCount: 0 },
      { name: 'RPG', description: 'Role-playing games with story and progression', playCount: 0 },
      { name: 'Arcade', description: 'Classic arcade-style games', playCount: 0 },
      { name: 'Adventure', description: 'Exploration and story-driven games', playCount: 0 },
    ]);

    // ================= ADMIN =================
    const adminPassword = await bcrypt.hash('password', 10);

    const admin = await User.create({
      username: 'admin',
      email: 'admin@peanutbutter.com',
      password: adminPassword,
      role: 'admin',
    });

    // ================= USERS =================
    const users = await User.insertMany([
      { username: 'user1', email: 'user1@peanutbutter.com', password: adminPassword, role: 'user' },
      { username: 'user2', email: 'user2@peanutbutter.com', password: adminPassword, role: 'user' },
    ]);

    // ================= GAMES =================
    const allUsers = [admin, ...users];
    const games: any[] = [];

    for (let i = 1; i <= 10; i++) {
      const randomUser =
        allUsers[Math.floor(Math.random() * allUsers.length)];

      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];

      const genres = ['Action', 'Puzzle', 'RPG', 'Adventure', 'Strategy'];

      games.push({
        title: `Game ${i}`,
        description: 'Demo game',
        slug: `game-${i}`,
        category: randomCategory.name,
        genre: genres[Math.floor(Math.random() * genres.length)],
        uploadedBy: randomUser._id,
        filePath: '/uploads/demo',
        entryFile: 'index.html',
        fileType: 'html',
        fileSize: 12345,
        thumbnailUrl: '',
        isVisible: true,
        isFeatured: i % 3 === 0,
        playCount: Math.floor(Math.random() * 100),
      });
    }

    await Game.insertMany(games);

    console.log('Seeding Complete ✅');
  } catch (err) {
    console.error('Seed Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
