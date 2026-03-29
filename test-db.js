import mongoose from "mongoose";

async function test() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  await mongoose.connect(uri, {
    dbName: dbName || undefined,
  });

  const db = mongoose.connection.db;
  const users = await db.collection("users").find({}).toArray();
  console.log(users.map((u) => ({ email: u.email, role: u.role })));

  await mongoose.connection.close();
  process.exit(0);
}
test();
