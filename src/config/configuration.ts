export default () => ({
  server: {
    port: parseInt(process.env.PORT ?? '8080', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtIssuer: process.env.JWT_ISSUER ?? 'vra-bff',
    jwtAudience: process.env.JWT_AUDIENCE ?? 'ventaagent-ms',
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
    database: process.env.MONGODB_DATABASE ?? 'vra20',
    vectorDatabase: process.env.MONGODB_VECTOR_DATABASE ?? 'vra_vectors',
  },
  vectorSearch: {
    indexName: process.env.VECTOR_INDEX_NAME ?? 'vector_index',
    embeddingDimension: parseInt(process.env.VECTOR_EMBEDDING_DIMENSION ?? '1024', 10),
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    agentModel: process.env.AGENT_MODEL ?? 'anthropic/claude-sonnet-4-20250514',
    embeddingModel: process.env.EMBEDDING_MODEL ?? 'anthropic/voyage-3',
  },
  gcs: {
    bucketName: process.env.GCS_BUCKET_NAME,
    projectId: process.env.GCS_PROJECT_ID,
  },
  mcp: {
    serverPort: parseInt(process.env.MCP_SERVER_PORT ?? '3001', 10),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '20', 10),
  },
})
