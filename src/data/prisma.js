require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const databaseUrl = new URL(process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/lontrinos");
const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname || "127.0.0.1",
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username || "root"),
  password: decodeURIComponent(databaseUrl.password || ""),
  database: databaseUrl.pathname.replace(/^\//, "") || "lontrinos",
  connectionLimit: 5
});
const prisma = new PrismaClient({ adapter });
module.exports = prisma;
