import { Routes, Route } from 'react-router-dom'
import { HikesProvider } from './context/HikesContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import HikeDetailPage from './pages/HikeDetailPage'
import HikeFormPage from './pages/HikeFormPage'

export default function App() {
  return (
    <HikesProvider>
      <div className="min-h-screen bg-forest-950">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hike/new" element={<HikeFormPage />} />
          <Route path="/hike/:id" element={<HikeDetailPage />} />
          <Route path="/hike/:id/edit" element={<HikeFormPage />} />
        </Routes>
      </div>
    </HikesProvider>
  )
}
