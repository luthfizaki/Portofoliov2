import * as argon2 from "argon2";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SEED_ADMIN_NAME;
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !password || password === "replace-before-running") {
    throw new Error(
      "Set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and a secure SEED_ADMIN_PASSWORD before seeding.",
    );
  }

  await prisma.user.upsert({
    where: { email },
    update: { name, role: UserRole.SUPER_ADMIN, isActive: true },
    create: {
      name,
      email,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      role: UserRole.SUPER_ADMIN,
    },
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
