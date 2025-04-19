import { createClient as createRedisClient } from 'redis';


export const redis = createRedisClient({
  url: process.env.REDIS_URL,
});

export const connectRedis = async () => {
  await redis.connect();
};

export const redisUrlSetter = async (appName: string, appUrl: string, apiUrl: string) => {

  // connect to redis
  await connectRedis();

  await redis.set(`proxy:${appName}.makex.app`, appUrl);
  await redis.set(`proxy:api-${appName}.makex.app`, apiUrl);

  // disconnect from redis
  await redis.disconnect();
};
