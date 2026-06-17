import dotenv from "dotenv";

dotenv.config();

class configModule {
    readonly MONGO_URL:string;
    readonly PORT:string;
    readonly EMAIL_USER:string;
    readonly EMAIL_PASS:string;
    readonly ADMIN_EMAIL:string;
    readonly ADMIN_PASSWORD:string;
    readonly ADMIN_NAME:string;
    readonly ACCESS_TOKEN_SECRET:string;
    readonly REFRESH_TOKEN_SECRET:string;
    readonly ACCESS_TOKEN_EXPIRY:string;
    readonly CLOUDINARY_CLOUD_NAME:string;
    readonly CLOUDINARY_API_KEY:string;
    readonly CLOUDINARY_API_SECRET:string



    //Authentication
    // readonly ACCESS_TOKEN_SECRET:string;
    // readonly REFRESH_TOKEN_SECRET:string;

    // //Cloudinary
    // readonly CLOUDINARY_CLOUD_NAME:string;
    // readonly CLOUDINARY_API_KEY:string;
    // readonly CLOUDINARY_API_SECRET:string;

    constructor(){

        this.PORT= process.env.PORT!;

        this.MONGO_URL=this.validateRequired('MONGO_URL',process.env.MONGO_URL);
        this.ACCESS_TOKEN_SECRET=this.validateRequired("ACCESS_TOKEN_SECRET",process.env.ACCESS_TOKEN_SECRET);
        this.REFRESH_TOKEN_SECRET=this.validateRequired("REFRESH_TOKEN_SECRET",process.env.REFRESH_TOKEN_SECRET);
        this.ACCESS_TOKEN_EXPIRY=this.validateRequired("REFRESH_TOKEN_SECRET",process.env.ACCESS_TOKEN_EXPIRY);
        this.EMAIL_USER = this.validateRequired("EMAIL_USER", process.env.EMAIL_USER);
        this.EMAIL_PASS = this.validateRequired("EMAIL_PASS", process.env.EMAIL_PASS);
        this.ADMIN_EMAIL= this.validateRequired("ADMIN_EMAIL",process.env.ADMIN_EMAIL);
        this.ADMIN_PASSWORD = this.validateRequired("ADMIN_PASSWORD",process.env.ADMIN_PASSWORD);
        this.ADMIN_NAME= this.validateRequired("ADMIN_NAME",process.env.ADMIN_NAME);

        this.CLOUDINARY_CLOUD_NAME = this.validateRequired("CLOUDINARY_CLOUD_NAME",process.env.CLOUDINARY_CLOUD_NAME);
        this.CLOUDINARY_API_KEY = this.validateRequired("CLOUDINARY_API_KEY",process.env.CLOUDINARY_API_KEY);
        this.CLOUDINARY_API_SECRET = this.validateRequired("CLOUDINARY_API_SECRET",process.env.CLOUDINARY_API_SECRET);

        // this.ACCESS_TOKEN_SECRET= this.validateRequired("ACCESS_TOKEN_SECRET",process.env.ACCESS_TOKEN_SECRET);
        // this.REFRESH_TOKEN_SECRET=this.validateRequired("REFRESH_TOKEN_SECRET",process.env.REFRESH_TOKEN_SECRET);

        // this.CLOUDINARY_CLOUD_NAME = this.validateRequired('CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME);
        // this.CLOUDINARY_API_KEY = this.validateRequired('CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY);
        // this.CLOUDINARY_API_SECRET = this.validateRequired('CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET);
    }
    
    private validateRequired(key:string, value:string | undefined):string{
        if(!value){
            throw new Error(`Missing required environment variable ${key}`);
        }
        return value;
    }
}

export const loadEnv= new configModule();

