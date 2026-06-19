import { motion } from 'framer-motion'
import { FaMountain, FaFutbol, FaCode } from 'react-icons/fa'
import FadeIn from './FadeIn'

const HOBBIES = [
  {
    icon: FaMountain,
    title: 'Hiking',
    subtitle: 'Into the wild',
    description:
      'There is nothing like clearing the mind on a long trail through nature. Hiking teaches patience, persistence, and how to enjoy the journey — not just the destination.',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)',
    borderColor: 'rgba(16,185,129,0.2)',
    hoverBorder: 'rgba(16,185,129,0.45)',
    iconColor: '#10b981',
    iconGlow: 'rgba(16,185,129,0.25)',
    tagColor: 'rgba(16,185,129,0.12)',
    tagText: '#6ee7b7',
    tagBorder: 'rgba(16,185,129,0.2)',
    tag: 'Outdoors',
    accentGlow: 'rgba(16,185,129,0.08)',
  },
  {
    icon: FaFutbol,
    title: 'Futsal',
    subtitle: 'Fast & technical',
    description:
      'Fast-paced indoor football that demands quick thinking, sharp reflexes, and real teamwork. The intensity on the court translates directly into how I approach complex problems.',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.06) 100%)',
    borderColor: 'rgba(245,158,11,0.2)',
    hoverBorder: 'rgba(245,158,11,0.45)',
    iconColor: '#f59e0b',
    iconGlow: 'rgba(245,158,11,0.25)',
    tagColor: 'rgba(245,158,11,0.12)',
    tagText: '#fcd34d',
    tagBorder: 'rgba(245,158,11,0.2)',
    tag: 'Sports',
    accentGlow: 'rgba(245,158,11,0.08)',
  },
  {
    icon: FaCode,
    title: 'Learning New Tech',
    subtitle: 'Always curious',
    description:
      'If it is new and interesting, I am already building something with it. Constantly experimenting with new frameworks, tools, and AI products keeps my thinking sharp and my work fresh.',
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.06) 100%)',
    borderColor: 'rgba(124,58,237,0.2)',
    hoverBorder: 'rgba(124,58,237,0.45)',
    iconColor: '#7c3aed',
    iconGlow: 'rgba(124,58,237,0.25)',
    tagColor: 'rgba(124,58,237,0.12)',
    tagText: '#a78bfa',
    tagBorder: 'rgba(124,58,237,0.2)',
    tag: 'Growth',
    accentGlow: 'rgba(124,58,237,0.08)',
  },
]

function HobbyCard({ hobby, index }) {
  const Icon = hobby.icon

  return (
    <FadeIn delay={index * 0.12} direction="up">
      <motion.div
        className="group relative rounded-2xl p-7 h-full flex flex-col gap-5 overflow-hidden cursor-default transition-all duration-300"
        style={{
          background: hobby.gradient,
          border: `1px solid ${hobby.borderColor}`,
        }}
        whileHover={{
          y: -6,
          transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = `1px solid ${hobby.hoverBorder}`
          e.currentTarget.style.boxShadow = `0 20px 60px ${hobby.accentGlow}`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = `1px solid ${hobby.borderColor}`
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Decorative background icon */}
        <div
          className="absolute -right-4 -bottom-4 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity duration-300"
          style={{ color: hobby.iconColor }}
        >
          <Icon size={120} />
        </div>

        {/* Icon badge */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: hobby.tagColor,
            border: `1px solid ${hobby.tagBorder}`,
            boxShadow: `0 0 20px ${hobby.iconGlow}`,
          }}
        >
          <Icon size={22} style={{ color: hobby.iconColor }} />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                className="text-xl font-bold text-white mb-0.5"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {hobby.title}
              </h3>
              <p className="text-xs font-medium" style={{ color: hobby.iconColor }}>
                {hobby.subtitle}
              </p>
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 mt-1"
              style={{
                background: hobby.tagColor,
                color: hobby.tagText,
                border: `1px solid ${hobby.tagBorder}`,
              }}
            >
              {hobby.tag}
            </span>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed">{hobby.description}</p>
        </div>
      </motion.div>
    </FadeIn>
  )
}

export default function Hobbies() {
  return (
    <section id="hobbies" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>
            Beyond the screen
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold mb-4"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #f8fafc, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Hobbies
          </h2>
          <div className="h-px w-14 rounded mb-5" style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }} />
          <p className="text-slate-500 text-sm leading-relaxed mb-14 max-w-lg">
            What I do when I am not shipping features or debugging at 2am.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5">
          {HOBBIES.map((hobby, i) => (
            <HobbyCard key={hobby.title} hobby={hobby} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
