/**
 * Netlify Serverless Function: validate-ffl
 *
 * Secure API proxy that handles FFL (Federal Firearms License) searches and validations.
 * API keys (FFL API / ComplianceGrid) are stored securely in Netlify environment variables
 * and never exposed to the client browser.
 */

export async function handler(event) {
  // CORS Pre-flight support
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  const FFL_API_KEY = process.env.FFL_API_KEY || "";
  if (!FFL_API_KEY) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "FFL validation provider is not configured. Firearm checkout is locked.",
        locked: true,
      }),
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const zipcode = String(payload.zipcode || "").trim();
    const radius = Math.min(Math.max(Number(payload.radius || 25), 1), 100);
    const licenseNumber = String(payload.licenseNumber || "").trim();

    // 1. Single License Verification Mode
    if (licenseNumber) {
      // Validate FFL license format (e.g., 1-23-456-78-9A-01234 or stripped digits)
      const cleanLicense = licenseNumber.replace(/\D/g, "");
      if (cleanLicense.length < 10) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Invalid FFL license format." }),
        };
      }

      // Query verification against provider
      const verifyRes = await fetch("https://app.fflapi.com/v1/verify-ffl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-Authorization": FFL_API_KEY,
        },
        body: JSON.stringify({ license: licenseNumber }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);

      if (!verifyRes || !verifyRes.ok) {
        // Fallback: If verification endpoint is unavailable or returns 404
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            valid: false,
            licenseNumber,
            message: "Unable to verify FFL license status with provider.",
          }),
        };
      }

      const verifyData = await verifyRes.json();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valid: Boolean(verifyData.active || verifyData.valid),
          licenseNumber,
          dealer: {
            businessName: verifyData.business_name || verifyData.license_name || "",
            premiseAddress: verifyData.premise_address || verifyData.address || "",
            expires: verifyData.expires || verifyData.expiration_date || null,
          },
        }),
      };
    }

    // 2. ZIP Code Proximity Search Mode
    if (!/^\d{5}$/.test(zipcode)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "A valid five-digit ZIP code is required." }),
      };
    }

    const response = await fetch("https://app.fflapi.com/v1/get-ffl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-Authorization": FFL_API_KEY,
      },
      body: JSON.stringify({ zipcode, radius: String(radius) }),
      signal: AbortSignal.timeout(10000),
    });

    const rawData = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: rawData?.message || "FFL provider request failed.",
        }),
      };
    }

    const rows = Array.isArray(rawData)
      ? rawData
      : rawData.ffls || rawData.data || rawData.results || [];

    // Sanitize dealer data: expose only public premise information, strip all provider metadata
    const sanitizedDealers = rows.map((dealer, index) => ({
      id: dealer.id || dealer.license_number || `ffl-${index}`,
      businessName: dealer.business_name || dealer.name || dealer.license_name || "Licensed FFL Dealer",
      premiseAddress: dealer.premise_address || dealer.address || [dealer.street, dealer.city, dealer.state, dealer.zip].filter(Boolean).join(", "),
      distance: dealer.distance ? `${dealer.distance} mi` : "",
      licenseNumber: dealer.license_number || dealer.lic_number || dealer.ffl_number || "",
      phone: dealer.phone || "",
      city: dealer.city || "",
      state: dealer.state || "",
      zip: dealer.zip || "",
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=1800, s-maxage=3600",
      },
      body: JSON.stringify({
        success: true,
        count: sanitizedDealers.length,
        dealers: sanitizedDealers,
      }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: `FFL lookup error: ${error.message}` }),
    };
  }
}
