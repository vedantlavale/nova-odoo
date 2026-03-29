import bcrypt from "bcryptjs";

async function test() {
  const hash = "$2b$12$w.C97WbEc.o8KI8iqhudA.FZebh9Q9xpFMEaPsWm/7sz8LqFXYYRm";
  const isValid = await bcrypt.compare("Password@123", hash);
  console.log("IsValid:", isValid);
  process.exit(0);
}
test();
