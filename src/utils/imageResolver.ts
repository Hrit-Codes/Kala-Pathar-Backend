import { resolveImageUrl } from "./resolveImageUrl";

const IMAGE_INTERNAL_FIELDS = ["PublicId", "LocalPath", "LocalUrl"];

const stripImageFields = (obj: Record<string, any>): Record<string, any> => {
    const result = { ...obj };
    Object.keys(result).forEach((key) => {
        if (IMAGE_INTERNAL_FIELDS.some((suffix) => key.endsWith(suffix))) {
            delete result[key];
        }
    });
    return result;
};

export class ImageResolver {
    static async resolveSingle(url: string, localUrl: string): Promise<string> {
        return resolveImageUrl(url, localUrl);
    }

    static async resolveArray(urls: string[], localUrls: string[]): Promise<string[]> {
        return Promise.all(urls.map((url, i) => resolveImageUrl(url, localUrls[i] ?? "")));
    }

    static async resolveSubdocument<T extends Record<string, any>>(
        subdoc: T,
        urlKey: keyof T,
        localUrlKey: keyof T
    ): Promise<Record<string, any>> {
        if (!subdoc) return subdoc;
        const plain = subdoc.toObject ? subdoc.toObject() : { ...subdoc };
        const resolved = await resolveImageUrl(
            plain[urlKey as string] ?? "",
            plain[localUrlKey as string] ?? ""
        );
        return stripImageFields({ ...plain, [urlKey]: resolved });
    }

    static async resolveSubdocumentArray<T extends Record<string, any>>(
        items: T[],
        urlKey: keyof T,
        localUrlKey: keyof T
    ): Promise<Record<string, any>[]> {
        return Promise.all(
            items.map((item) => ImageResolver.resolveSubdocument(item, urlKey, localUrlKey))
        );
    }

    static prepare(obj: Record<string, any>): Record<string, any> {
        return stripImageFields(obj);
    }
}