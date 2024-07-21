const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "출석체크",
      description: "Node.js, mongoDB RestFul(아님) API 클라이언트 UI",
    },
    servers: [
      {
        url: "/", // Adjust this to your server address
        description: "api server",
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
    tags: [
      { name: 'Users', description: '유저 추가 수정 삭제 조회' },
      { name: 'Sessions', description: '세션 생성, 관리' },
      { name: 'Attendance', description: '출석체크 진행, 관리, 출석 관련 작업' },
    ],
    'x-tagGroups': [
      {
        name: 'Main',
        tags: ['Users', 'Sessions', 'Attendance'],
      },
    ],
  },
  apis: ["./api/routers/*.js"], // Swagger 파일 연동
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
