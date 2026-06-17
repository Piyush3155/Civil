"use server";

/**
 * Gen AI Floor Plan Generator — Server Action
 * Calls the Gemini API to generate a FloorPlanData JSON from a natural language prompt.
 */

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are a 2D floor plan generator. Output ONLY a valid JSON object.

Format:
{
  "nodes": [{ "id": "string", "x": number, "y": number, "floorIndex": 0 }],
  "walls": [{ "id": "string", "startNodeId": "string", "endNodeId": "string", "thickness": 0.2, "height": 3, "floorIndex": 0 }],
  "openings": [{ "id": "string", "wallId": "string", "type": "door", "distanceFromStart": number, "width": 0.9, "height": 2.1, "elevation": 0, "floorIndex": 0 }],
  "roomLabels": [{ "id": "string", "text": "string", "x": number, "y": number, "floorIndex": 0 }]
}

Rules:
- 1 meter = 20 units. Center plot at (0,0).
- Convert dimensions from feet to meters (1 ft = 0.3m), then multiply by 20.
- Keep the layout VERY SIMPLE. Use a maximum of 15 walls total to represent the outer boundary and 2-3 internal walls.
- Do not overcomplicate the math. Output ONLY raw JSON.`;

export async function generateFloorPlan(
  userPrompt: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY1,
  ].filter(Boolean);

  if (apiKeys.length === 0) {
    return {
      success: false,
      error: "No Gemini API key configured. Please add GEMINI_API_KEY to your .env file.",
    };
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\n---\n\nUSER REQUEST: ${userPrompt}\n\nGenerate the floor plan JSON now:`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  let lastError = "";

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (status ${response.status}):`, errorText);

        // On rate limit (429), try the next key. If we are out of keys, we'll return an error.
        if (response.status === 429) {
          try {
            const errJson = JSON.parse(errorText);
            const retryInfo = errJson?.error?.details?.find(
              (d: any) => d["@type"]?.includes("RetryInfo")
            );
            if (retryInfo?.retryDelay) {
              const secs = Math.ceil(parseFloat(retryInfo.retryDelay));
              lastError = `Rate limit exceeded. Please wait ${secs} seconds before trying again.`;
            } else {
              lastError = "Rate limit exceeded on this API key.";
            }
          } catch {
            lastError = "Rate limit exceeded on this API key.";
          }
          continue; // Try next key
        }

        lastError = `Gemini API returned status ${response.status}`;
        continue; // Try next key
      }

      const result = await response.json();

      // Extract the generated text
      const generatedText =
        result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        lastError = "Gemini returned an empty response.";
        continue;
      }

      // Parse the JSON (strip any accidental markdown fences)
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText
          .replace(/^```(?:json)?\s*\n?/, "")
          .replace(/\n?```\s*$/, "");
      }

      let floorPlanData;
      try {
        floorPlanData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("JSON Parse Error. Raw text from Gemini:");
        console.error(cleanedText);
        throw parseError;
      }

      // Basic validation
      if (
        !floorPlanData.nodes ||
        !Array.isArray(floorPlanData.nodes) ||
        !floorPlanData.walls ||
        !Array.isArray(floorPlanData.walls)
      ) {
        return {
          success: false,
          error:
            "AI generated an invalid floor plan structure. Please try again with a clearer prompt.",
        };
      }

      // Ensure optional arrays exist
      if (!floorPlanData.openings) floorPlanData.openings = [];
      if (!floorPlanData.siteElements) floorPlanData.siteElements = [];
      if (!floorPlanData.roomLabels) floorPlanData.roomLabels = [];

      return { success: true, data: floorPlanData };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Gemini API call failed:", message);
      lastError = message;
      continue; // Try next key
    }
  }

  return {
    success: false,
    error: `Failed to generate floor plan: ${lastError}`,
  };
}
