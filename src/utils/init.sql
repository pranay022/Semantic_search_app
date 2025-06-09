

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(384) 
);

CREATE INDEX idx_vector_cosine
ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
