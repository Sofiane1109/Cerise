import { FaGithub, FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa'
import FadeIn from './FadeIn'

const PROJECTS = [
  {
    name: 'Myne',
    tagline: 'All-in-one personal dashboard',
    description:
      'Combining nutrition tracking, budget management, task lists, calendar, hiking stats, and Spotify music insights — all beautifully unified in one place.',
    stack: ['React', 'Vite', 'Tailwind CSS', 'Supabase'],
    github: 'https://github.com/Sofiane1109/Cerise',
    featured: true,
  },
  {
    placeholder: true,
    name: 'Coming Soon',
    description: 'A new project is currently in the works. Stay tuned.',
    stack: [],
  },
  {
    placeholder: true,
    name: 'Coming Soon',
    description: 'Another exciting project on the horizon.',
    stack: [],
  },
]

function StackTag({ label }) {
  return (
    <span
      className="text-[11px] font-medium px-2.5 py-1 rounded-full"
      style={{
        background: 'rgba(124,58,237,0.12)',
        color: '#a78bfa',
        border: '1px solid rgba(124,58,237,0.2)',
      }}
    >
      {label}
    </span>
  )
}

function FeaturedCard({ project }) {
  return (
    <FadeIn delay={0}>
      <div
        className="group relative rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-default"
        style={{
          background: 'rgba(124,58,237,0.05)',
          border: '1px solid rgba(124,58,237,0.2)',
          boxShadow: '0 0 50px rgba(124,58,237,0.08)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = '1px solid rgba(124,58,237,0.4)'
          e.currentTarget.style.boxShadow = '0 0 60px rgba(124,58,237,0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = '1px solid rgba(124,58,237,0.2)'
          e.currentTarget.style.boxShadow = '0 0 50px rgba(124,58,237,0.08)'
        }}
      >
        {/* Background glow */}
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: '40%',
            height: '100%',
            background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative">
          {/* Featured badge */}
          <div className="flex items-center justify-between mb-6">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{
                background: 'rgba(124,58,237,0.15)',
                color: '#a78bfa',
                border: '1px solid rgba(124,58,237,0.25)',
              }}
            >
              Featured Project
            </span>
            <div className="flex gap-3">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium cursor-pointer"
                  aria-label={`${project.name} GitHub`}
                >
                  <FaGithub size={16} />
                  <span>Source</span>
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium cursor-pointer"
                  aria-label={`${project.name} demo`}
                >
                  <FaExternalLinkAlt size={13} />
                  <span>Live</span>
                </a>
              )}
            </div>
          </div>

          <h3
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {project.name}
          </h3>
          <p className="text-sm font-medium mb-4" style={{ color: '#a78bfa' }}>
            {project.tagline}
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-lg">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.stack.map((t) => (
              <StackTag key={t} label={t} />
            ))}
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

function PlaceholderCard({ index }) {
  return (
    <FadeIn delay={index * 0.1}>
      <div
        className="rounded-2xl p-6 min-h-52 flex flex-col items-center justify-center gap-3"
        style={{
          border: '1px dashed rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          <FaArrowRight size={13} style={{ color: '#7c3aed' }} />
        </div>
        <p className="text-slate-600 text-sm font-medium text-center">
          Project coming soon
        </p>
      </div>
    </FadeIn>
  )
}

export default function Projects() {
  const featured = PROJECTS.find((p) => p.featured)
  const rest = PROJECTS.filter((p) => !p.featured)

  return (
    <section id="projects" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>
            What I&apos;ve built
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
            Projects
          </h2>
          <div className="h-px w-14 rounded mb-14" style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }} />
        </FadeIn>

        <div className="space-y-5">
          {featured && <FeaturedCard project={featured} />}
          <div className="grid md:grid-cols-2 gap-5">
            {rest.map((project, i) =>
              project.placeholder ? (
                <PlaceholderCard key={i} index={i + 1} />
              ) : null
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
