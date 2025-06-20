const db = require("../db/config");
const { getEmbedding } = require("../utils/embedding");
const { Kysely, sql } = require("kysely");
const redisClient = require('../utils/redisClient')

async function insertDocument(req, res) {
  const content = req.body.texts;
  if (Array.isArray(content) && content.length > 0) {
    content = content[0];
  }

  if (typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({
      error: "Invalid or missing 'text' field. It must be a non-empty string.",
    });
  }
  try {
    console.log("Generating embedding for:", content);
    const embedding = await getEmbedding(content);
    console.log("Generated embedding:", embedding.slice(0, 5), "...");

    const result = await db
      .insertInto("documents")
      .values({
        content: content,
        embedding: sql`${sql.lit(`[${embedding.join(",")}]`)}::vector`,
      })
      .returning("id")
      .execute();

    const documentId = result[0]?.id;
    console.log(`[API] Document inserted successfully with ID: ${documentId}`);
    console.log("Document inserted successfully:", result);
    return true;
  } catch (error) {
    console.error("Error in insertDocument:", error);
    return { error: `Insert failed: ${error.message}` };
  }
}

async function bulkInsertDocuments(req) {
  const documentsToProcess = req.body.documents;
  if (
    !documentsToProcess ||
    !Array.isArray(documentsToProcess) ||
    documentsToProcess.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "No documents array provided in the request body." });
  }
  const successfulEmbeddings = [];
  const embeddingErrors = [];
  try {
    const embeddingPromises = documentsToProcess.map(async (doc, index) => {
      const { content } = doc;
      let processedContent = content;
      if (Array.isArray(processedContent) && processedContent.length > 0) {
        processedContent = processedContent[0];
      }
      if (
        typeof processedContent !== "string" ||
        processedContent.trim() === ""
      ) {
        const errorMsg = `Document at index ${index} has invalid or missing 'content'.`;
        embeddingErrors.push({
          index,
          originalContent: doc.content,
          error: errorMsg,
        });
        console.error(`[API] ${errorMsg}`);
        return null;
      }
      try {
        console.log(
          `[API] Processing document ${index}: "${processedContent.substring(
            0,
            Math.min(processedContent.length, 50)
          )}..."`
        );
        const embedding = await getEmbedding(processedContent, "document");
        successfulEmbeddings.push({
          content: processedContent,
          embedding,
          index,
        });
        console.log(
          `[API] Embedding generated for document ${index}. Length: ${embedding.length}`
        );
        return true;
      } catch (error) {
        const errorMsg = `Failed to generate embedding for document at index ${index}: ${error.message}`;
        embeddingErrors.push({
          index,
          originalContent: processedContent,
          error: errorMsg,
        });
        console.error(`[API] ${errorMsg}`);
        return null;
      }
    });
    await Promise.all(embeddingPromises);

    if (successfulEmbeddings.length === 0) {
      const msg =
        "No documents could be processed for embedding. See 'embeddingErrors' for details.";
      return {
        message: msg,
        total: documentsToProcess.length,
        successful: 0,
        failed: embeddingErrors.length,
        embeddingErrors: embeddingErrors,
      };
    }

    const valuesToInsert = successfulEmbeddings.map((doc) => ({
      content: doc.content,
      embedding: sql`${sql.lit(`[${doc.embedding.join(",")}]`)}::vector`,
    }));

    let successfulDbInserts = 0;
    let failedDbInserts = 0;
    let dbErrors = [];

    try {
      const dbResult = await db
        .insertInto("documents")
        .values(valuesToInsert)
        .returning("id")
        .execute();

      successfulDbInserts = dbResult.length;
      console.log(
        `[API] Bulk DB insert successful for ${successfulDbInserts} documents. IDs: ${dbResult
          .map((r) => r.id)
          .join(", ")}`
      );
    } catch (dbError) {
      console.error(`[API] Database bulk insert failed:`, dbError.message);
      dbErrors.push({ error: dbError.message });
      failedDbInserts = successfulEmbeddings.length;
      successfulEmbeddings.length = 0;
    }

    const responseSummary = {
      totalDocumentsRequested: documentsToProcess.length,
      successfullyEmbeddedAndInserted: successfulEmbeddings.length,
      failedToEmbed: embeddingErrors.length,
      failedToInsertInDB:
        dbErrors.length > 0
          ? documentsToProcess.length - embeddingErrors.length
          : 0,
      embeddingErrors: embeddingErrors.length > 0 ? embeddingErrors : undefined,
      databaseErrors: dbErrors.length > 0 ? dbErrors : undefined,
    };

    if (
      responseSummary.successfullyEmbeddedAndInserted ===
        documentsToProcess.length &&
      embeddingErrors.length === 0 &&
      dbErrors.length === 0
    ) {
      return {
        message: "All documents inserted successfully!",
        ...responseSummary,
      };
    } else {
      return {
        message: "Bulk document insertion completed with some issues.",
        ...responseSummary,
      };
    }
  } catch (outerError) {
    console.error(
      "[API] Bulk insert operation failed completely:",
      outerError.message
    );
    res.status(500).json({
      error: `Bulk insert operation failed: ${outerError.message}`,
      details: outerError.message,
    });
  }
}

async function semanticSearch(req, res) {
  const query = req.body.search;
  const limit = req.body.limit || 3;
  if (!query || typeof query !== "string" || query.trim() === "") {
    return res
      .status(400)
      .json({ error: "Missing or invalid 'search' query in the request." });
  }
  if (isNaN(limit) || limit <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid 'limit' provided. Must be a positive number." });
  }
  const cacheKey = `search:${query.trim().toLowerCase()}:${limit}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Found in cache ${cacheKey}`);
      return res.status(200).json(JSON.parse(cached));
    }
    console.log("[CACHE MISS] Performing semantic search for:", query);
    console.log("Searching for:", query);
    const embedding = await getEmbedding(query);
    console.log("Generated query embedding with length:", embedding.length);
    const result = await db
      .selectFrom("documents")
      .select([
        "id",
        "content",
        sql`(embedding <=> ${sql.lit(`[${embedding.join(",")}]`)})`.as(
          "distance"
        ),
      ])
      .orderBy(sql`(embedding <=> ${sql.lit(`[${embedding.join(",")}]`)}) ASC`)
      .limit(limit * 2) 
      .execute();
    const resultsWithSimilarity = result
      .map((r) => {
        const similarity = Math.max(0, 1 - r.distance); 
        return {
          id: r.id,
          content: r.content,
          metadata: r.metadata ? JSON.parse(r.metadata) : null, 
          distance: r.distance,
          similarity: similarity,
        };
      })
      .sort((a, b) => b.similarity - a.similarity) 
      .slice(0, limit);
    console.log(`Top ${limit} results for "${query}:`);
    resultsWithSimilarity.forEach((r) =>
      console.log(
        `- (${r.id}) [distance: ${r.distance}, similarity: ${r.similarity}] ${r.content}`
      )
    );
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    return resultsWithSimilarity.map(({ id, content, similarity }) => ({
      id,
      content,
      similarity,
    }));
  } catch (error) {
    console.error("[API] Search error:", error);
    if (error.code) {
      console.error(`[API] DB Error Code: ${error.code}`);
    }
    return { error: "Search failed", details: error.message };
  }
}

async function getAllDocuments() {
  try {
    const data = await db
      .selectFrom("documents")
      .select(["id", "content"])
      .execute();
    console.log("All documents in database:", data);
    return data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw { error: "Error while fetching data" };
  }
}

async function deleteDocument(req) {
  const { id } = req.params;
  try {
    const [result] = await db
      .deleteFrom("documents")
      .where("id", "=", Number(id))
      .execute();

    if (result.numDeletedRows === 0n) {
      return { error: "Item not found" };
    }

    return true;
  } catch (error) {
    throw { error: "Error while deleteing document" };
  }
}

module.exports = {
  insertDocument,
  bulkInsertDocuments,
  semanticSearch,
  getAllDocuments,
  deleteDocument,
};
