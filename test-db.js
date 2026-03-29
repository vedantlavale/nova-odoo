import mongoose from "mongoose";

async function test() {
  await mongoose.connect("mongodb+srv://vedantlavale_db_user:sT58S2xn8Ryla5ig@cluster0.2xche4b.mongodb.net/", {
    dbName: "reimbursement-management",
  });
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log(users.map((u) => ({ email: u.email, role: u.role, passwordHash: u.passwordHash })));
  process.exit(0);
}
test();
