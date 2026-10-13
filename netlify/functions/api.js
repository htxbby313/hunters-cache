import serverless from "serverless-http";
import { app, getSchemaReady } from "../../server.js";

const handle = serverless(app);

export async function handler(event, context) {
  try {
    await getSchemaReady();
    return handle(event, context);
  } catch (error) {
    console.error("Database initialization failed:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Database initialization failed", detail: error.message }),
    };
  }
}
