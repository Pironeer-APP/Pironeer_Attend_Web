const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const api = require("./api/routers/index");
const { createInitAdmin } = require("./api/controllers/userController");

const app = express();
app.use(cors());

app.use(express.json());

app.use("/api", api);

const { swaggerUi, specs } = require("./swagger/swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

connectDB()
  .then(async () => {
    await createInitAdmin();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection failed", err);
    process.exit(1);
  });
