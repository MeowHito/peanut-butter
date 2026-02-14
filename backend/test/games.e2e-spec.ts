import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('Games (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;
    let createdGameId: string;

    const testUser = {
        username: `gameuser_${Date.now()}`,
        email: `gameuser_${Date.now()}@example.com`,
        password: 'test123456',
    };

    // Create temp test files
    const testDir = path.join(__dirname, 'temp_test_files');
    const testHtmlPath = path.join(testDir, 'test-game.html');
    const testZipPath = path.join(testDir, 'test-game.zip');
    const testInvalidPath = path.join(testDir, 'test-file.txt');

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        await app.init();

        // Create temp test files
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Create a test HTML file
        fs.writeFileSync(
            testHtmlPath,
            '<html><head><title>Test Game</title></head><body><h1>Test Game</h1></body></html>',
        );

        // Create a test ZIP file with AdmZip
        const AdmZip = require('adm-zip');
        const zip = new AdmZip();
        zip.addFile(
            'index.html',
            Buffer.from('<html><head><title>Zip Game</title></head><body><h1>Zip Game</h1></body></html>'),
        );
        zip.writeZip(testZipPath);

        // Create an invalid file type
        fs.writeFileSync(testInvalidPath, 'this is a text file');

        // Register and login to get token
        const registerRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send(testUser);
        accessToken = registerRes.body.access_token;
    });

    afterAll(async () => {
        // Clean up test files
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        await app.close();
    });

    // ==================== UPLOAD ====================

    describe('POST /games/upload', () => {
        it('should upload an HTML game file', async () => {
            const res = await request(app.getHttpServer())
                .post('/games/upload')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('title', `Test HTML Game ${Date.now()}`)
                .field('description', 'A test HTML game')
                .attach('gameFile', testHtmlPath)
                .expect(201);

            expect(res.body.message).toBe('Game uploaded successfully');
            expect(res.body.game).toBeDefined();
            expect(res.body.game.fileType).toBe('html');
            expect(res.body.game.id).toBeDefined();
            createdGameId = res.body.game.id;
        });

        it('should upload a ZIP game file', async () => {
            const res = await request(app.getHttpServer())
                .post('/games/upload')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('title', `Test ZIP Game ${Date.now()}`)
                .field('description', 'A test ZIP game')
                .attach('gameFile', testZipPath)
                .expect(201);

            expect(res.body.message).toBe('Game uploaded successfully');
            expect(res.body.game.fileType).toBe('zip');
        });

        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .post('/games/upload')
                .field('title', 'No Auth Game')
                .attach('gameFile', testHtmlPath)
                .expect(401);
        });

        it('should fail with missing title', async () => {
            await request(app.getHttpServer())
                .post('/games/upload')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('gameFile', testHtmlPath)
                .expect(400);
        });

        it('should fail with duplicate title', async () => {
            const title = `Duplicate Game ${Date.now()}`;

            // Upload first
            await request(app.getHttpServer())
                .post('/games/upload')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('title', title)
                .attach('gameFile', testHtmlPath)
                .expect(201);

            // Upload duplicate
            await request(app.getHttpServer())
                .post('/games/upload')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('title', title)
                .attach('gameFile', testHtmlPath)
                .expect(400);
        });
    });

    // ==================== LIST ====================

    describe('GET /games', () => {
        it('should list all games', async () => {
            const res = await request(app.getHttpServer())
                .get('/games')
                .expect(200);

            expect(res.body.games).toBeDefined();
            expect(Array.isArray(res.body.games)).toBe(true);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.total).toBeGreaterThan(0);
        });

        it('should support pagination', async () => {
            const res = await request(app.getHttpServer())
                .get('/games?page=1&limit=1')
                .expect(200);

            expect(res.body.games.length).toBeLessThanOrEqual(1);
            expect(res.body.pagination.limit).toBe(1);
        });
    });

    // ==================== GET SINGLE ====================

    describe('GET /games/:id', () => {
        it('should get a single game', async () => {
            const res = await request(app.getHttpServer())
                .get(`/games/${createdGameId}`)
                .expect(200);

            expect(res.body.id).toBe(createdGameId);
            expect(res.body.title).toBeDefined();
            expect(res.body.playUrl).toBeDefined();
        });

        it('should return 404 for non-existent game', async () => {
            await request(app.getHttpServer())
                .get('/games/000000000000000000000000')
                .expect(404);
        });
    });

    // ==================== PLAY ====================

    describe('GET /games/:id/play', () => {
        it('should serve the game HTML file', async () => {
            const res = await request(app.getHttpServer())
                .get(`/games/${createdGameId}/play`)
                .expect(200);

            expect(res.text).toContain('<html>');
        });
    });

    // ==================== DELETE ====================

    describe('DELETE /games/:id', () => {
        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/games/${createdGameId}`)
                .expect(401);
        });

        it('should delete own game', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/games/${createdGameId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.message).toBe('Game deleted successfully');
        });

        it('should return 404 after deletion', async () => {
            await request(app.getHttpServer())
                .get(`/games/${createdGameId}`)
                .expect(404);
        });
    });
});
