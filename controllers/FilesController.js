const { ObjectID } = require('mongodb');
const { env } = require('process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const db = dbClient.client.db(dbClient.dbName);
const collectionFiles = db.collection('files');
const collectionUsers = db.collection('users');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await collectionUsers.findOne({ _id: new ObjectID(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let { parentId, isPublic } = req.body;
    const { name, type, data } = req.body;
    const typesAllowed = ['folder', 'file', 'image'];

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !typesAllowed.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId) {
      const file = await collectionFiles.findOne({ _id: new ObjectID(parentId) });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    if (parentId) {
      parentId = new ObjectID(parentId);
    } else {
      parentId = 0;
    }
    isPublic = isPublic || false;

    if (type === 'folder') {
      const insertedFile = await collectionFiles.insertOne({
        userId: new ObjectID(userId),
        name,
        type,
        isPublic,
        parentId,
      });
      return res.status(201).json({
        id: insertedFile.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }

    const folderPath = env.FOLDER_PATH || '/tmp/files_manager';
    const fileName = uuidv4();
    const filePath = `${folderPath}/${fileName}`;
    const dataDecoded = Buffer.from(data, 'base64').toString();

    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
      } else {
        fs.writeFile(filePath, dataDecoded, 'utf-8', (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
    });

    const newFile = await collectionFiles.insertOne({
      userId: new ObjectID(userId),
      name,
      type,
      isPublic,
      parentId,
      localPath: filePath,
    });

    return res.status(201).json({
      id: newFile.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const user = await collectionUsers.findOne({ _id: new ObjectID(userId) });

    if (!user || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await collectionFiles.findOne({
      _id: new ObjectID(id),
      userId: new ObjectID(userId),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json({
      _id: file._id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const user = await collectionUsers.findOne({ _id: new ObjectID(userId) });

    if (!user || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId } = req.query;
    let { page } = req.query;
    page = page || 0;

    let pipeline;
    let files;
    if (parentId) {
      pipeline = [
        { $match: { parentId: ObjectID(parentId) } },
        { $skip: page * 20 },
        { $limit: 20 },
      ];
      files = await collectionFiles.aggregate(pipeline).toArray();
    } else {
      pipeline = [{ $skip: page * 20 }, { $limit: 20 }];
      files = await collectionFiles.aggregate(pipeline).toArray();
    }
    const filesRespList = [];
    if (files.length === 0) {
      return res.status(200).json([]);
    }
    files.forEach((file) => {
      filesRespList.push({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    });
    return res.status(200).json(filesRespList);
  }
}

module.exports = FilesController;
