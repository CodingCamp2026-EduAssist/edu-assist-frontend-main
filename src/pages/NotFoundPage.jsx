import { useNavigate } from 'react-router-dom'

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0efed',
      fontFamily: 'sans-serif',
      gap: '1rem'
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#1a1a2e' }}>404</h1>
      <p style={{ fontSize: '1rem', color: '#6b7280' }}>Halaman tidak ditemukan</p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '0.6rem 1.5rem',
          borderRadius: '100px',
          border: 'none',
          background: '#2563eb',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}
      >
        Kembali ke Home
      </button>
    </div>
  )
}

export default NotFoundPage