import fs from "fs";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import { tags } from "./components/tags.js";
import sharedComponents from "./components/index.js";
import { getPathDetails } from "#/shared/utils";

const { __dirname } = getPathDetails(import.meta.url);

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
    tags,
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
      ...sharedComponents,
    },
  },
  apis: [`${__dirname}/paths/*.yml`],
};

export const openapiSpec = swaggerJsdoc(options);

const filePath = `${__dirname}/generated/api-spec.json`;
fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, JSON.stringify(openapiSpec, null, 2));
