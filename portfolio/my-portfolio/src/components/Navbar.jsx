import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaGithub, FaLinkedin } from 'react-icons/fa'

const LINKS = ['About', 'Skills', 'Projects', 'Hobbies', 'Contact']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { threshold: 0.3 }
    )
    LINKS.forEach((link) => {
      const el = document.getElementById(link.toLowerCase())
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <>
      <motion.header
        className="fixed top-5 inset-x-0 z-50 flex justify-center px-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="hidden md:flex items-center gap-1 px-3 py-2 rounded-full"
          style={{
            background: scrolled ? 'rgba(3,0,20,0.96)' : 'rgba(3,0,20,0.7)',
            border: scrolled
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(255,255,255,0.06)',
            boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm font-bold tracking-tight px-3 py-1.5 rounded-full mr-1 cursor-pointer"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            SE
          </button>

          {LINKS.map((link) => (
            <button
              key={link}
              onClick={() => scrollTo(link)}
              className="relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                color: activeSection === link.toLowerCase() ? '#ffffff' : '#94a3b8',
                background:
                  activeSection === link.toLowerCase()
                    ? 'rgba(124,58,237,0.2)'
                    : 'transparent',
              }}
            >
              {link}
            </button>
          ))}

          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10">
            <a
              href="https://github.com/Sofiane1109"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer"
              aria-label="GitHub"
            >
              <FaGithub size={15} />
            </a>
            <a
              href="https://www.linkedin.com/in/sofiane-en-nali/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full text-slate-400 hover:text-blue-400 transition-colors duration-200 cursor-pointer"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={15} />
            </a>
          </div>
        </div>

        {/* Mobile bar */}
        <div
          className="md:hidden flex items-center justify-between w-full px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(3,0,20,0.96)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm font-bold cursor-pointer"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            SE
          </button>
          <button
            className="flex flex-col gap-1.5 p-2 cursor-pointer"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <motion.span
              className="block w-5 h-0.5 rounded-full bg-slate-300"
              animate={mobileOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            />
            <motion.span
              className="block w-5 h-0.5 rounded-full bg-slate-300"
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
            />
            <motion.span
              className="block w-5 h-0.5 rounded-full bg-slate-300"
              animate={mobileOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            />
          </button>
        </div>
      </motion.header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 inset-x-4 z-40 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(3,0,20,0.97)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
          >
            <ul className="flex flex-col p-3 gap-1">
              {LINKS.map((link) => (
                <li key={link}>
                  <button
                    onClick={() => scrollTo(link)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      color: activeSection === link.toLowerCase() ? '#ffffff' : '#94a3b8',
                      background:
                        activeSection === link.toLowerCase()
                          ? 'rgba(124,58,237,0.15)'
                          : 'transparent',
                    }}
                  >
                    {link}
                  </button>
                </li>
              ))}
              <li className="flex gap-3 px-4 pt-3 mt-1 border-t border-white/08">
                <a href="https://github.com/Sofiane1109" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white cursor-pointer">
                  <FaGithub size={18} />
                </a>
                <a href="https://www.linkedin.com/in/sofiane-en-nali/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 cursor-pointer">
                  <FaLinkedin size={18} />
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
