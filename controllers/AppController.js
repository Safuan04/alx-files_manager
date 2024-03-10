const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  static getStatus(req, res) {
    return res.status(200).json(
      { redis: redisClient.isAlive(), db: dbClient.isAlive() },
    );
  }

  static async getStats(req, res) {
    const nbFiles = await dbClient.nbFiles();
    const nbUsers = await dbClient.nbUsers();
    return res.status(200).json(
      { users: nbUsers, files: nbFiles },
    );
  }
}

module.exports = AppController;
