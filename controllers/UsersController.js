const sha1 = require('sha1');
const dbClient = require('../utils/db');

const db = dbClient.client.db(dbClient.dbName);
const collection = db.collection('users');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const hashedPwd = sha1(password);

    const emailFinder = await collection.findOne({ email });
    if (emailFinder) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const insertedUser = await collection.insertOne({ email, password: hashedPwd });
    console.log(insertedUser);
    return res.status(201).json({ id: insertedUser.insertedId, email });
  }
}

module.exports = UsersController;
