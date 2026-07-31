export const dynamic = 'force-dynamic';

async function getOpenAPISpec() {
  try {
    const res = await fetch('https://mindcast-backend.onrender.com/openapi.json', {
      cache: 'no-store',
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
}

export default async function OpenAPIDiagPage() {
  const spec = await getOpenAPISpec();
  const paths = spec.paths ? Object.keys(spec.paths) : [];
  const authPaths = paths.filter((p: string) =>
    p.toLowerCase().includes('auth') ||
    p.toLowerCase().includes('user') ||
    p.toLowerCase().includes('login') ||
    p.toLowerCase().includes('register') ||
    p.toLowerCase().includes('token') ||
    p.toLowerCase().includes('signup') ||
    p === '/me'
  );

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', background: '#1a1a1a', color: '#00ff00', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff' }}>OpenAPI Diagnostic</h1>
      {spec.error ? (
        <p style={{ color: 'red' }}>Error: {spec.error}</p>
      ) : (
        <>
          <h2>API Info: {spec.info?.title} v{spec.info?.version}</h2>
          <h2>Auth-Related Paths ({authPaths.length}):</h2>
          <ul>
            {authPaths.map((p: string) => (
              <li key={p} style={{ marginBottom: '8px' }}>
                <strong>{p}</strong>
                <pre style={{ fontSize: '12px', color: '#aaa' }}>
                  {JSON.stringify(spec.paths[p], null, 2)}
                </pre>
              </li>
            ))}
          </ul>
          <h2>All Paths ({paths.length}):</h2>
          <ul>
            {paths.map((p: string) => <li key={p}>{p}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
