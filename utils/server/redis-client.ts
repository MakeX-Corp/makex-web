import { createClient as createRedisClient } from "redis";

export const redis = createRedisClient({
  url: process.env.REDIS_URL,
});

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};

export const redisUrlSetter = async (appName: string, appUrl: string) => {
  await connectRedis();

  console.log("App Deets", appName, appUrl);

  const appUrlSet = await redis.set(`proxy:${appName}.makex.app`, `${appUrl}`);

  console.log("Redis URLs set successfully", appUrlSet);

  if (redis.isOpen) {
    await redis.disconnect();
  }
};

export const proxySetter = async (currentUrl: string, newUrl: string) => {
  await connectRedis();

  const setUrl = await redis.set(`proxy:${newUrl}`, `${currentUrl}`);

  console.log("Redis URL set successfully", setUrl);

  if (redis.isOpen) {
    await redis.disconnect();
  }
};
