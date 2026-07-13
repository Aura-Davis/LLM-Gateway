export async function callModel(prompt, model = "gemini-flash-latest") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  const start = Date.now();

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Model API error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  const candidate = data.candidates?.[0];
  const text =
    candidate?.content?.parts?.map((p) => p.text || "").join("") ?? "";

  if (!text && candidate?.finishReason) {
    throw new Error(`Model returned no content (finishReason: ${candidate.finishReason})`);
  }

  return { text, latencyMs, model };
}
