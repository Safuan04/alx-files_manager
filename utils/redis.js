const { promisify } = require('util');
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient()
    this.isConnected = true;
    this.client.on('error', (err) => {
      console.error(err);
      this.isConnected = false;
    })
    this.client.on('connect', () => {
      this.isConnected = true;
    })
  }

  isAlive() {
    return this.isConnected;
  }

  async get(key) {
    const asyncGet = promisify(this.client.get).bind(this.client);
    try {
      return await asyncGet(key);
    } catch (err) {
      console.error(err);
    }
  }

  async set(key, value, duration) {
    const asyncSet = promisify(this.client.setex).bind(this.client);
    try {
      return await asyncSet(key, duration, value);
    } catch (err) {
      console.error(err);
    }
  }

  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    try {
      return await asyncDel(key);
    } catch (err) {
      console.error(err);
    }
  }
}

const redisClient = new RedisClient()

module.exports = redisClient;
