const axios = require("axios");
require("dotenv").config();

async function getEmbedding(text) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            source_sentence: text,
            sentences: [text],
          },
        }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `API request failed with status ${response.status}: ${
          errorData?.error || response.statusText
        }`
      );
    }
    const data = await response.json();
    const embedding = Array(384)
      .fill(0)
      .map((_, i) => data[i] || 0);

    console.log(
      "Successfully generated embedding with length:",
      embedding.length
    );
    return embedding;
  } catch (err) {
    console.error("Error in generateEmbedding:", err.message);
    if (err.response) {
      console.error("API Response:", err.response.data);
    }
    throw new Error(`Failed to generate embedding: ${err.message}`);
  }
}

module.exports = { getEmbedding };
