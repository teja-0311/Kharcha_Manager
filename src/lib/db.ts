import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || "expense-tracker";
const MONGODB_USERS_DB = process.env.MONGODB_USERS_DB || "expenses-user";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

/**
 * Global cache to reuse the connection across hot reloads in development
 * and across serverless function invocations in production.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
  // eslint-disable-next-line no-var
  var _mongooseUsersCache: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

let cached = global._mongooseCache;
let usersCached = global._mongooseUsersCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}
if (!usersCached) {
  usersCached = global._mongooseUsersCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB,
      maxPoolSize: 10,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export async function connectUsersDB(): Promise<mongoose.Connection> {
  if (usersCached.conn) {
    return usersCached.conn;
  }

  if (!usersCached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_USERS_DB,
      maxPoolSize: 10,
    };
    usersCached.promise = mongoose.createConnection(MONGODB_URI, opts).asPromise();
  }

  try {
    usersCached.conn = await usersCached.promise;
  } catch (err) {
    usersCached.promise = null;
    throw err;
  }

  return usersCached.conn;
}
