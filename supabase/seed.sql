-- Insert some sample documents for testing
insert into documents (title, content, metadata) values
(
  'Getting Started with Supabase',
  'Supabase is an open source Firebase alternative. It provides a PostgreSQL database, authentication, real-time subscriptions, and storage.',
  '{"category": "documentation", "tags": ["supabase", "database", "postgresql"]}'
),
(
  'Cloudflare Workers Overview',
  'Cloudflare Workers is a serverless platform that allows you to run JavaScript, TypeScript, and other languages at the edge of Cloudflare''s global network.',
  '{"category": "documentation", "tags": ["cloudflare", "workers", "serverless"]}'
),
(
  'OpenAI API Integration',
  'The OpenAI API provides access to powerful language models like GPT-4, GPT-3.5-turbo, and text-embedding-ada-002 for various AI applications.',
  '{"category": "documentation", "tags": ["openai", "ai", "gpt", "embeddings"]}'
),
(
  'Vector Embeddings Guide',
  'Vector embeddings are numerical representations of text that capture semantic meaning. They enable similarity search and are essential for RAG applications.',
  '{"category": "guide", "tags": ["embeddings", "vectors", "semantic-search", "rag"]}'
),
(
  'MCP Protocol Specification',
  'The Model Context Protocol (MCP) is a standard for connecting AI models to external data sources and tools in a secure and efficient manner.',
  '{"category": "specification", "tags": ["mcp", "protocol", "ai", "integration"]}'
);
