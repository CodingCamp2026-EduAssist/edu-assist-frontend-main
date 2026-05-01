import { BrowserRouter, Routes, Route } from 'react-router-dom'
import OnboardingPage from './pages/OnboardingPage'
import ChatPage from './pages/ChatPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
