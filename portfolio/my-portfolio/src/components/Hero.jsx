import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaGithub, FaLinkedin, FaArrowDown } from 'react-icons/fa'

const PHRASES = [
  'Web & Mobile Development',
  'AI & Data Engineering',
  'Digital Consulting',
]

function useTypewriter() {
  const [text, setText] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = PHRASES[phraseIdx]
    let t
    if (!deleting && text === phrase) {
      t = setTimeout(() => setDeleting(true), 2400)
    } else if (deleting && text === '') {
      setDeleting(false)
      setPhraseIdx((i) => (i + 1) % PHRASES.length)
    } else {
      t = setTimeout(
        () =>
          setText(
            deleting ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1)
          ),
        deleting ? 35 : 70
      )
    }
    return () => clearTimeout(t)
  }, [text, deleting, phraseIdx])

  return text
}

export default function Hero() {
  const text = useTypewriter()

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Ambient orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-15%', left: '-15%',
          width: '65vw', height: '65vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-15%', right: '-10%',
          width: '50vw', height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '30vw', height: '30vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">

        {/* Available badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}
          />
          <span className="text-xs font-semibold" style={{ color: '#86efac' }}>
            Available for opportunities
          </span>
        </motion.div>

        {/* Name */}
        <motion.h1
          className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-5"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 45%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Sofiane En-Nali
        </motion.h1>

        {/* Role */}
        <motion.p
          className="text-base sm:text-lg font-medium mb-4"
          style={{ color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Computer Science Student · Belgium
        </motion.p>

        {/* Typewriter */}
        <motion.div
          className="h-10 flex items-center justify-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="text-xl sm:text-2xl font-semibold"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {text}
            <span style={{ WebkitTextFillColor: '#7c3aed' }}>|</span>
          </span>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            onClick={() => scrollTo('projects')}
            className="px-8 py-3.5 rounded-full font-semibold text-white text-sm transition-all duration-300 hover:scale-105 hover:brightness-110 cursor-pointer"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              boxShadow: '0 0 28px rgba(124,58,237,0.4), 0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            View my work
          </button>
          <button
            onClick={() => scrollTo('contact')}
            className="px-8 py-3.5 rounded-full font-semibold text-sm text-slate-200 transition-all duration-300 hover:scale-105 hover:bg-white/10 cursor-pointer"
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            Get in touch
          </button>
        </motion.div>

        {/* Social links */}
        <motion.div
          className="flex items-center justify-center gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <a
            href="https://github.com/Sofiane1109"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-all duration-200 hover:scale-110 cursor-pointer"
            aria-label="GitHub"
          >
            <FaGithub size={20} />
            <span className="text-xs font-medium">GitHub</span>
          </a>
          <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <a
            href="https://www.linkedin.com/in/sofiane-en-nali/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-all duration-200 hover:scale-110 cursor-pointer"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={20} />
            <span className="text-xs font-medium">LinkedIn</span>
          </a>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
      <motion.button
        onClick={() => scrollTo('about')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        aria-label="Scroll down"
      >
        <span className="text-[10px] text-slate-600 tracking-widest uppercase">Scroll</span>
        <motion.div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FaArrowDown size={11} style={{ color: '#475569' }} />
        </motion.div>
      </motion.button>
    </section>
  )
}
