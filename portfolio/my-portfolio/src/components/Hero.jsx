import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { FaGithub, FaLinkedin } from 'react-icons/fa'

const PHRASES = [
  'Web & Mobile Development',
  'AI & Data Engineering',
  'Digital Consultant',
]

function useTypewriter() {
  const [text, setText] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = PHRASES[phraseIdx]
    let t

    if (!deleting && text === phrase) {
      t = setTimeout(() => setDeleting(true), 2200)
    } else if (deleting && text === '') {
      setDeleting(false)
      setPhraseIdx((i) => (i + 1) % PHRASES.length)
    } else {
      t = setTimeout(
        () =>
          setText(
            deleting ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1)
          ),
        deleting ? 38 : 75
      )
    }
    return () => clearTimeout(t)
  }, [text, deleting, phraseIdx])

  return text
}

const PARTICLE_OPTIONS = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    color: { value: ['#7c3aed', '#3b82f6', '#a855f7'] },
    move: {
      direction: 'none',
      enable: true,
      outModes: { default: 'out' },
      random: true,
      speed: 0.4,
      straight: false,
    },
    number: { density: { enable: true, area: 900 }, value: 90 },
    opacity: { value: { min: 0.08, max: 0.4 } },
    shape: { type: 'circle' },
    size: { value: { min: 1, max: 2.5 } },
  },
  detectRetina: true,
}

export default function Hero() {
  const [particlesReady, setParticlesReady] = useState(false)
  const text = useTypewriter()

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setParticlesReady(true))
  }, [])

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {particlesReady && (
        <Particles
          id="tsparticles"
          className="absolute inset-0"
          options={PARTICLE_OPTIONS}
        />
      )}

      {/* Ambient orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%',
          left: '-10%',
          width: '55vw',
          height: '55vw',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 68%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%',
          right: '-5%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 68%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p
          className="text-xs font-semibold tracking-widest uppercase mb-5"
          style={{ color: '#a78bfa' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Hello, I&apos;m
        </motion.p>

        <motion.h1
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-6"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 55%, #94a3b8 100%)',
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

        <motion.p
          className="text-base sm:text-lg font-medium mb-5"
          style={{ color: '#94a3b8' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          Computer Science Student
        </motion.p>

        <motion.div
          className="h-9 flex items-center justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="text-lg sm:text-xl font-medium"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {text}
            <span style={{ WebkitTextFillColor: '#7c3aed', animation: 'blink 1s step-end infinite' }}>|</span>
          </span>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            onClick={() => scrollTo('projects')}
            className="px-8 py-3.5 rounded-full font-semibold text-white text-sm transition-all duration-300 hover:scale-105 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              boxShadow: '0 0 24px rgba(124,58,237,0.35)',
            }}
          >
            See my projects
          </button>
          <button
            onClick={() => scrollTo('contact')}
            className="px-8 py-3.5 rounded-full font-semibold text-sm text-slate-200 transition-all duration-300 hover:scale-105 hover:bg-white/10"
            style={{
              border: '1px solid rgba(124,58,237,0.45)',
              background: 'rgba(124,58,237,0.08)',
            }}
          >
            Get in touch
          </button>
        </motion.div>

        <motion.div
          className="flex items-center justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <a
            href="https://github.com/Sofiane1109"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-white transition-all duration-200 hover:scale-110"
            aria-label="GitHub"
          >
            <FaGithub size={22} />
          </a>
          <a
            href="https://www.linkedin.com/in/sofiane-en-nali/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-400 transition-all duration-200 hover:scale-110"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={22} />
          </a>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <span className="text-xs text-slate-600 tracking-widest uppercase">Scroll</span>
        <motion.div
          className="w-px h-10 rounded-full"
          style={{ background: 'linear-gradient(180deg, #7c3aed, transparent)' }}
          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

    </section>
  )
}
