require("dotenv").config();
const app = require("./app");
const migrate = require("./db/migrate");

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await migrate();

  app.listen(PORT, () => {
    console.log(`🚀 Insighta API running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
