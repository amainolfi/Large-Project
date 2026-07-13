import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod;

export async function connectTestDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("macrovanta-test"));
}

export async function disconnectTestDb() {
  await mongoose.disconnect();

  if (mongod) {
    await mongod.stop();
  }
}

export async function clearTestDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}
