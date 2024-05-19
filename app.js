const express = require('express');
const connectDB = require('./config/db');
const api = require('./api/routers/index');

const app = express();

app.use(express.json());

app.use('/api', api);

const { swaggerUi, specs } = require("./swagger/swagger")

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

connectDB().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}).catch((err) => {
    console.error("Database connection failed", err);
    process.exit(1);
});