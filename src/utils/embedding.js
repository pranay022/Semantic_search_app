require("dotenv").config();
const { CohereClient } = require("cohere-ai");
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function getEmbedding(text) {
  try {
    console.log(`Generating embedding for text: "${text.substring(0, 50)}..."`);
    const response = await cohere.embed({
      texts: [text],
      model: "embed-english-v3.0",
      input_type: "search_query",
    });

    const embedding = response.embeddings[0];

    if (!embedding || embedding.length === 0) {
      throw new Error("Cohere API returned an empty or invalid embedding.");
    }
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    const normalizedEmbedding = embedding.map((val) => val / magnitude);

    console.log(
      "Successfully generated normalized Cohere embedding with length:",
      normalizedEmbedding.length
    );
    return normalizedEmbedding;
  } catch (err) {
    console.error("Error in getEmbedding (Cohere):", err.message);
    if (err.statusCode) {
      console.error("Cohere API Status Code:", err.statusCode);
      console.error("Cohere API Error Details:", err.body);
    }
    throw new Error(`Failed to generate embedding with Cohere: ${err.message}`);
  }
}

module.exports = { getEmbedding };
