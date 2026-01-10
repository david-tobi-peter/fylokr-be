import fs from "fs";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

const dirname = path.resolve(__dirname);
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fylokr API",
      description: "API Endpoints for Fylokr",
      contact: {
        name: "David Oluwatobi Peter",
        email: "davidoluwatobi41@gmail.com",
      },
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000/v1",
      },
    ],
    tags: [],
    components: {
      securitySchemes: {
        authToken: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
        },
        verificationToken: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
        },
      },
    },
  },
  apis: [`${dirname}/paths/*.yml`],
};

export const openapiSpec = swaggerJsdoc(options);

const filePath = `${dirname}/generated/api-spec.json`;
fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, JSON.stringify(openapiSpec, null, 2));
