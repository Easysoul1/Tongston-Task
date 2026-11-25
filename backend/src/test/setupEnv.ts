process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tongston-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-used-against-a-real-db';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
