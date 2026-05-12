export default function EnvCheck() {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Check</h1>
      <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        {JSON.stringify(envVars, null, 2)}
      </pre>
      <hr />
      <h2>All import.meta.env:</h2>
      <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        {JSON.stringify(import.meta.env, null, 2)}
      </pre>
    </div>
  );
}
