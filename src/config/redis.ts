import Redis from "ioredis";

export const redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6381,
});

redisClient.on("connect", () => {
    console.log("Redis connected successfully");
});

redisClient.on("error", (err) => {
    console.error("Redis connection error:", err);
});