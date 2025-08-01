import { createClient as createRedisClient } from "redis";

export const redis = createRedisClient({
  url: process.env.REDIS_URL,
});

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};

export const redisUrlSetter = async (
  appName: string,
  appUrl: string,
) => {
  // connect to redis
  await connectRedis();

  console.log("App Deets", appName, appUrl);

  const appUrlSet = await redis.set(`proxy:${appName}.makex.app`, `${appUrl}`);


  console.log("Redis URLs set successfully", appUrlSet);

  // disconnect from redis
  if (redis.isOpen) {
    await redis.disconnect();
  }
};

export const proxySetter = async (currentUrl: string, newUrl: string) => {
  // connect to redis
  await connectRedis();

  // set the new url
  const setUrl = await redis.set(`proxy:${newUrl}`, `${currentUrl}`);

  console.log("Redis URL set successfully", setUrl);

  // disconnect from redis
  if (redis.isOpen) {
    await redis.disconnect();
  }
};
