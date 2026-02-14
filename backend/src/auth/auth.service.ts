import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { username, email, password } = registerDto;

        // Check if user already exists
        const existingUser = await this.userModel.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new ConflictException('Email already registered');
            }
            throw new ConflictException('Username already taken');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await this.userModel.create({
            username,
            email,
            password: hashedPassword,
        });

        // Generate JWT
        const token = this.generateToken(user);

        return {
            message: 'Registration successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
            access_token: token,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user by email
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Generate JWT
        const token = this.generateToken(user);

        return {
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
            access_token: token,
        };
    }

    async getProfile(userId: string) {
        const user = await this.userModel.findById(userId).select('-password');
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return {
            id: user._id,
            username: user.username,
            email: user.email,
            createdAt: (user as any).createdAt,
        };
    }

    private generateToken(user: UserDocument): string {
        const payload = {
            sub: user._id,
            email: user.email,
            username: user.username,
        };
        return this.jwtService.sign(payload);
    }
}
