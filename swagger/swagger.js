const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "출석체크",
      description: "프로젝트 설명 Node.js Swagger swagger-jsdoc 방식 RestFul API 클라이언트 UI",
    },
    servers: [
      {
        url: "http://localhost:3000", // Adjust this to your server address
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./api/routers/*.js"], // Swagger 파일 연동
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
