import dotenv from "dotenv";
import path from "path";

const environment = process.env.NODE_ENV || 'development';
const envFile = environment === 'production' ? '.env.production' : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

class configModule {
    // Environment
    readonly NODE_ENV: string;
    readonly PORT: string;
    readonly HOST: string;

    // Database
    readonly MONGO_URL: string;

    // Email
    readonly EMAIL_USER: string;
    readonly EMAIL_PASS: string;

    // Admin
    readonly ADMIN_EMAIL: string;
    readonly ADMIN_PASSWORD: string;
    readonly ADMIN_NAME: string;

    // JWT
    readonly ACCESS_TOKEN_SECRET: string;
    readonly REFRESH_TOKEN_SECRET: string;
    readonly ACCESS_TOKEN_EXPIRY: string;

    // Redis
    readonly REDIS_HOST: string;
    readonly REDIS_PORT: string;

    // Cloudinary
    readonly CLOUDINARY_CLOUD_NAME: string;
    readonly CLOUDINARY_API_KEY: string;
    readonly CLOUDINARY_API_SECRET: string;

    // CORS
    readonly CORS_ORIGIN: string;

    constructor() {
        this.NODE_ENV = process.env.NODE_ENV || 'development';
        this.PORT = process.env.PORT || '5000';
        this.HOST = process.env.HOST || 'localhost';

        this.MONGO_URL = this.validateRequired('MONGO_URL', process.env.MONGO_URL);
        this.EMAIL_USER = this.validateRequired('EMAIL_USER', process.env.EMAIL_USER);
        this.EMAIL_PASS = this.validateRequired('EMAIL_PASS', process.env.EMAIL_PASS);
        this.ADMIN_EMAIL = this.validateRequired('ADMIN_EMAIL', process.env.ADMIN_EMAIL);
        this.ADMIN_PASSWORD = this.validateRequired('ADMIN_PASSWORD', process.env.ADMIN_PASSWORD);
        this.ADMIN_NAME = this.validateRequired('ADMIN_NAME', process.env.ADMIN_NAME);
        this.ACCESS_TOKEN_SECRET = this.validateRequired('ACCESS_TOKEN_SECRET', process.env.ACCESS_TOKEN_SECRET);
        this.REFRESH_TOKEN_SECRET = this.validateRequired('REFRESH_TOKEN_SECRET', process.env.REFRESH_TOKEN_SECRET);
        this.ACCESS_TOKEN_EXPIRY = this.validateRequired('ACCESS_TOKEN_EXPIRY', process.env.ACCESS_TOKEN_EXPIRY) || '7d';
        
        this.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
        this.REDIS_PORT = process.env.REDIS_PORT || '6379';
        
        this.CLOUDINARY_CLOUD_NAME = this.validateRequired('CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME);
        this.CLOUDINARY_API_KEY = this.validateRequired('CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY);
        this.CLOUDINARY_API_SECRET = this.validateRequired('CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET);
        
        this.CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

        console.log(`✅ Loaded: ${envFile} (${this.NODE_ENV})`);
    }

    private validateRequired(key: string, value: string | undefined): string {
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }

    get REDIS_URL(): string {
        return `redis://${this.REDIS_HOST}:${this.REDIS_PORT}`;
    }

    get isProduction(): boolean {
        return this.NODE_ENV === 'production';
    }

    get isDevelopment(): boolean {
        return this.NODE_ENV === 'development';
    }
}

export const loadEnv = new configModule();
export type Config = typeof loadEnv;