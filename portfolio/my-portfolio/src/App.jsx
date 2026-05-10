import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Contact from './components/Contact'
import CursorGlow from './components/CursorGlow'

function Divider() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <div
        className="h-px rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />
    </div>
  )
}

export default function App() {
  return (
    <div style={{ backgroundColor: '#030014', minHeight: '100vh' }}>
      <CursorGlow />
      <Navbar />
      <main>
        <Hero />
        <Divider />
        <About />
        <Divider />
        <Skills />
        <Divider />
        <Projects />
        <Divider />
        <Contact />
      </main>
      <footer className="py-8 text-center">
        <p className="text-xs text-slate-700">
          © {new Date().getFullYear()} Sofiane En-Nali · Built with React & Vite
        </p>
      </footer>
    </div>
  )
}
