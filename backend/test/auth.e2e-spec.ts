import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;

    const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'test123456',
    };

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
    });

    afterAll(async () => {
        await app.close();
    });

    // ==================== REGISTER ====================

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(201);

            expect(res.body.message).toBe('Registration successful');
            expect(res.body.user).toBeDefined();
            expect(res.body.user.username).toBe(testUser.username);
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.access_token).toBeDefined();
            // Password should NOT be in response
            expect(res.body.user.password).toBeUndefined();
        });

        it('should fail with duplicate email', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username: 'different_user',
                    email: testUser.email,
                    password: 'test123456',
                })
                .expect(409);

            expect(res.body.message).toBe('Email already registered');
        });

        it('should fail with duplicate username', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username: testUser.username,
                    email: 'different@example.com',
                    password: 'test123456',
                })
                .expect(409);

            expect(res.body.message).toBe('Username already taken');
        });

        it('should fail with invalid email', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username: 'baduser',
                    email: 'not-an-email',
                    password: 'test123456',
                })
                .expect(400);
        });

        it('should fail with short password', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username: 'baduser2',
                    email: 'bad2@example.com',
                    password: '123',
                })
                .expect(400);
        });

        it('should fail with missing fields', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({})
                .expect(400);
        });
    });

    // ==================== LOGIN ====================

    describe('POST /auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(201);

            expect(res.body.message).toBe('Login successful');
            expect(res.body.user).toBeDefined();
            expect(res.body.access_token).toBeDefined();
            accessToken = res.body.access_token;
        });

        it('should fail with wrong password', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrong_password',
                })
                .expect(401);

            expect(res.body.message).toBe('Invalid email or password');
        });

        it('should fail with non-existent email', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'test123456',
                })
                .expect(401);

            expect(res.body.message).toBe('Invalid email or password');
        });

        it('should fail with missing fields', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({})
                .expect(400);
        });
    });

    // ==================== PROFILE (Protected) ====================

    describe('GET /auth/profile', () => {
        it('should get profile with valid token', async () => {
            const res = await request(app.getHttpServer())
                .get('/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.username).toBe(testUser.username);
            expect(res.body.email).toBe(testUser.email);
            expect(res.body.id).toBeDefined();
            expect(res.body.password).toBeUndefined();
        });

        it('should fail without token (401 Unauthorized)', async () => {
            await request(app.getHttpServer())
                .get('/auth/profile')
                .expect(401);
        });

        it('should fail with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/auth/profile')
                .set('Authorization', 'Bearer invalid_token_here')
                .expect(401);
        });
    });
});
