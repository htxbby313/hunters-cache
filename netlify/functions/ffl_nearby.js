// File: netlify/functions/ffl_nearby.js
/**
 * Netlify Function – Find nearby FFL dealers.
 * POST /api/ffl/nearby
 *   { "zipcode": "30301", "radius": 25 }   // radius in miles
 */
const { Pool } = require("pg");
const zipLatLon = require("./zip_latlon.json");

// Neon connection – expects NEON_DATABASE_URL env var (same as import script)
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { zipcode, radius = 25 } = payload;
  if (!zipcode) {
    return { statusCode: 400, body: "Missing `zipcode`" };
  }

  const zipInfo = zipLatLon[zipcode];
  if (!zipInfo) {
    return { statusCode: 404, body: "ZIP code not found" };
  }

  const { latitude: lat, longitude: lng } = zipInfo;
  // Convert miles to degrees (approximation: 1 degree ≈ 69 miles)
  const radiusDeg = radius / 69.0;

  const sql = `
    SELECT business_name, premise_street, premise_city, premise_state, premise_zip,
           latitude, longitude
    FROM ffl_dealers
    WHERE (point(longitude, latitude) <@> point($1, $2)) <= $3
    ORDER BY (point(longitude, latitude) <@> point($1, $2)) ASC
    LIMIT 50;
  `;

  try {
    const { rows } = await pool.query(sql, [lng, lat, radiusDeg]);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealers: rows }),
    };
  } catch (err) {
    console.error("DB error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
