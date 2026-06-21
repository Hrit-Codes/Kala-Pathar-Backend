import { TravelPackage } from "../model/package.model"
import { ApiError } from "./apiError";

export const FEATURED_MIN=4;
export const FEATURED_MAX=6;

export const getFeaturedCount= async(): Promise<number>=>{
    return TravelPackage.countDocuments({ isFeatured:true});
}

export const guardFeaturedIncrease=async(excludeId?:string)=>{
    const query:any= {isFeatured:true};
    if(excludeId) query._id={$ne:excludeId};

    const count= await TravelPackage.countDocuments(query);

    if(count>=FEATURED_MAX){
        throw new ApiError(409,`Maximum of ${FEATURED_MAX} featured packages allowed. Unfeature one before featuring another`);
    }
}

export const guardFeaturedDecrease=async(excludeId?:string)=>{
    const query:any = { isFeatured:true };
    if(excludeId) query._id={$ne:excludeId};

    const count= await TravelPackage.countDocuments(query);

    if(count<=FEATURED_MIN){
        throw new ApiError(409,`Minimum of ${FEATURED_MIN} featured packages must exist. Feature another package before unfeaturing this one`);
    }
}