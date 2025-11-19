import { createClient } from 'redis';

export const connectRedis = async () => {
  try {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,                 
        rejectUnauthorized: false
      }
    });

    client.on('error', (err) => {
      console.error('[redis] error:', err);
    });

    client.on('connect', () => {
      console.log('Connected to Redis (TLS)');
    });

    await client.connect();
    await client.ping();

    return client;
  } catch (err) {
    console.error('[redis] failed to connect:', err);
    return null;
  }
};
