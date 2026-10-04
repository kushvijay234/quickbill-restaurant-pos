/**
 * Helper to construct isolated database URIs from base MONGO_URI
 * Supports mongodb://, mongodb+srv://, query parameters, and custom database names.
 */
function buildDbUri(baseUri, dbName) {
  if (!baseUri) {
    throw new Error('Base MongoDB URI is required');
  }
  if (!dbName) {
    throw new Error('Database name is required');
  }

  const [base, query] = baseUri.split('?');
  const cleanBase = base.endsWith('/') ? base : base.substring(0, base.lastIndexOf('/') + 1);
  const uriWithDb = `${cleanBase}${dbName}`;
  return query ? `${uriWithDb}?${query}` : uriWithDb;
}

module.exports = {
  buildDbUri
};
