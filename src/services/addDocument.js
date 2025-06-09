const db = require("../db/config");
const { getEmbedding } = require("../utils/embedding");
const { Kysely, sql } = require("kysely");

async function insertDocument(req, res) {
  const content = req.body.document;
  if (!content) {
    return { message: "Missing content" };
  }
  try {
    const embedding = await getEmbedding(content);
    await db
      .insertInto("documents")
      .values({ content: content, embedding: `[${embedding.join(",")}]` })
      .execute();
    console.log("Document inserted.");
    return true;
  } catch (error) {
    console.error(error);
    return { message: "Insert failed" };
  }
}

async function bulkInsertDocuments(req) {
  const documents = req.body.documents;
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return { message: "No documents provided" };
  }
  try {
    const results = [];
    const errors = [];
      const bulkDocuments = documents.map(async (content) => {
        try {
          const embedding = await getEmbedding(content);
          const result = await db
            .insertInto("documents")
            .values({ content: content, embedding: `[${embedding.join(",")}]` })
            .execute();
          results.push({ content, status: "success" });
          return result;
        } catch (error) {
          console.error(`Error processing document: ${error.message}`);
          errors.push({ content, error: error.message });
          return null;
        }
      });
    return {
      total: documents.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Bulk insert failed:", error);
    return res.status(400).error.json({ error: "Bulk insert failed", error: error.message });
  }
}

async function semanticSearch(req, res) {
  const query = req.body.query;
  const limit = req.body.limit || 3;
  if (!query) {
    return message({ error: "Missing query " });
  }
  try {
    const embedding = await getEmbedding(query);
    const result = await db
      .selectFrom("documents")
      .select(["id", "content"])
      .orderBy(sql`embedding <#> ${sql.lit(`[${embedding.join(",")}]`)}`)
      .limit(limit)
      .execute();
    console.log(`Top ${limit} results for "${query}:`);
    result.forEach((r) => console.log(`- (${r.id}) ${r.content}`));
    return result;
  } catch (error) {
    console.error(error);
    return res.status(400).error.json({ error: "Search failed" });
  }
}

module.exports = {
  insertDocument,
  bulkInsertDocuments,
  semanticSearch,
};
