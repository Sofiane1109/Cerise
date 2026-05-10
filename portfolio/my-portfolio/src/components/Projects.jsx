import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'
import FadeIn from './FadeIn'

const PROJECTS = [
  {
    name: 'Myne',
    description:
      'All-in-one personal dashboard combining nutrition tracking, budget management, task lists, calendar, hiking stats, and Spotify music insights — all in one place.',
    stack: ['React', 'Vite', 'Tailwind CSS', 'Supabase'],
    github: 'https://github.com/Sofiane1109/Cerise',
    placeholder: false,
  },
  {
    placeholder: true,
    name: '[PROJECT]',
    description: 'A new project is in the works. Stay tuned.',
    stack: [],
  },
  {
    placeholder: true,
    name: '[PROJECT]',
    description: 'Another project coming soon.',
    stack: [],
  },
]

function StackTag({ label }) {
  return (
    <span
      className="text-[11px] font-medium px-2.5 py-1 rounded-full"
      style={{
        background: 'rgba(124,58,237,0.15)',
        color: '#a78bfa',
        border: '1px solid rgba(124,58,237,0.25)',
      }}
    >
      {label}
    </span>
  )
}

function ProjectCard({ project, index }) {
  if (project.placeholder) {
    return (
      <FadeIn delay={index * 0.1}>
        <div
          className="rounded-2xl p-6 h-full min-h-56 flex flex-col items-center justify-center gap-3"
          style={{
            border: '1px dashed rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <span className="text-violet-400 text-lg font-bold">+</span>
          </div>
          <p className="text-slate-600 text-sm font-medium">Project coming soon</p>
        </div>
      </FadeIn>
    )
  }

  return (
    <FadeIn delay={index * 0.1}>
      <div
        className="group rounded-2xl p-6 flex flex-col gap-4 h-full transition-all duration-300 hover:-translate-y-1"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 0 0 transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = '1px solid rgba(124,58,237,0.3)'
          e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
          e.currentTarget.style.boxShadow = '0 0 0 transparent'
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h3
            className="text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {project.name}
          </h3>
          <div className="flex gap-3 shrink-0">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-white transition-colors duration-200"
                aria-label={`${project.name} GitHub`}
              >
                <FaGithub size={18} />
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-white transition-colors duration-200"
                aria-label={`${project.name} demo`}
              >
                <FaExternalLinkAlt size={16} />
              </a>
            )}
          </div>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed flex-1">{project.description}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          {project.stack.map((t) => (
            <StackTag key={t} label={t} />
          ))}
        </div>
      </div>
    </FadeIn>
  )
}

export default function Projects() {
  return (
    <section id="projects" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: '#a78bfa' }}
          >
            What I&apos;ve built
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #f8fafc, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Projects
          </h2>
          <div
            className="h-px w-14 rounded mb-14"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
          />
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={`${project.name}-${i}`} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
