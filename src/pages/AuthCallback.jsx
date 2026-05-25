import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/authcallback.css'

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      localStorage.setItem('accessToken', token)
      navigate('/chat')
    } else {
      navigate('/')
    }
  }, [])

  return (
    <div className="callback-root">
      <div className="callback-grid" />
      <div className="callback-card">
        <div className="callback-spinner" />
        <p className="callback-text">Sedang masuk...</p>
        <p className="callback-sub">Mohon tunggu sebentar</p>
      </div>
    </div>
  )
}

export default AuthCallback