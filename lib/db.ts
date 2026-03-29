import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalWithMongoose.__mongooseCache ?? {
  conn: null,
  promise: null,
};

globalWithMongoose.__mongooseCache = cache;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB_NAME,
      })
      .then((client) => client);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
