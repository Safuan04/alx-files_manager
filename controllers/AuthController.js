const { v4: uuidv4 } = require('uuid');
const sha1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const db = dbClient.client.db(dbClient.dbName);
const collection = db.collection('users');

class AuthController {
  static async getConnect(req, res) {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authCode = authorization.split(' ')[1];
    const credentials = Buffer.from(authCode, 'base64').toString().split(':');

    if (credentials.length !== 2) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authEmail = credentials[0];
    const authPwd = credentials[1];
    const hashedAuthPwd = sha1(authPwd);

    const user = await collection.findOne({ email: authEmail, password: hashedAuthPwd });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;

    await redisClient.set(key, user._id, 86400);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const authToken = req.headers['x-token'];
    const user = await redisClient.get(`auth_${authToken}`);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(`auth_${authToken}`);
    return res.status(204).send('');
  }
}

module.exports = AuthController;
