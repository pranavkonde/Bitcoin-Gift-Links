import { Route, Routes } from 'react-router-dom'
import { GiftAppPage } from './pages/GiftAppPage'
import { LandingPage } from './pages/LandingPage'
import { ClaimGiftPage } from './pages/ClaimGiftPage'

function App() {
  return (
    <main className="container">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<GiftAppPage />} />
        <Route path="/claim" element={<ClaimGiftPage />} />
      </Routes>
    </main>
  )
}

export default App
