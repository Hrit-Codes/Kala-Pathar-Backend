import dotenv from "dotenv";

dotenv.config();

class configModule {
    readonly MONGO_URL:string;
    readonly PORT:string;

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

