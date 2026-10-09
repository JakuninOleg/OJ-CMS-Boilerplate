/** Keep CA verification portable: a Windows sslrootcert path cannot be used on Linux. */
export function databasePool(environment: NodeJS.ProcessEnv = process.env) {
  const connectionString = environment.DATABASE_URL || '';
  const ca = environment.DATABASE_CA_CERT;
  if (!ca) return { connectionString };
  if (!ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error('DATABASE_CA_CERT must contain a PEM certificate');
  let url: URL;
  try { url = new URL(connectionString); } catch { throw new Error('DATABASE_URL must be a PostgreSQL URL'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must be a PostgreSQL URL');
  // pg URL SSL parameters override pool.ssl. Explicit CA + hostname verification wins here.
  for (const key of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat']) url.searchParams.delete(key);
  return { connectionString: url.toString(), ssl: { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true } };
}
