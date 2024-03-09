const { MongoClient } = require('mongodb');
const { env } = require('process');

class DBClient {
  constructor() {
    const host = env.DB_HOST || 'localhost';
    const port = env.DB_PORT || 27017;
    this.db = env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.isConnected = false;

    this.client
      .connect()
      .then(() => {
        this.isConnected = true;
      })
      .catch((err) => {
        console.error('Error connecting to MongoDB', err);
      });
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    const dbCol = this.client.db(this.db).collection('users');
    const usersNb = await dbCol.countDocuments();
    return usersNb;
  }

  async nbFiles() {
    const dbCol = this.client.db(this.db).collection('files');
    const filesNb = await dbCol.countDocuments();
    return filesNb;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
