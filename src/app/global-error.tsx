'use client';
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: '#111111',
          color: '#F7F3EA',
          fontFamily: 'system-ui',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1>NEURIX hit an unexpected error</h1>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              background: '#D6B46A',
              color: '#111111',
              border: 0,
              borderRadius: 12,
              padding: '10px 18px',
              fontWeight: 600,
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
