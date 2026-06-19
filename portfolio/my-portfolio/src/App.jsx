import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Hobbies from './components/Hobbies'
import Contact from './components/Contact'

function Divider() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <div
        className="h-px rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }}
      />
    </div>
  )
}

export default function App() {
  return (
    <div style={{ backgroundColor: '#030014', minHeight: '100vh' }}>
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
        <Hobbies />
        <Divider />
        <Contact />
      </main>
      <footer className="py-10 text-center">
        <p className="text-xs text-slate-700">
          © {new Date().getFullYear()} Sofiane En-Nali · Built with React & Vite
        </p>
      </footer>
    </div>
  )
}
