import { FaHtml5, FaCss3Alt, FaGithub, FaDatabase, FaChartLine, FaRobot } from 'react-icons/fa'
import {
  SiJavascript,
  SiTailwindcss,
  SiVuedotjs,
  SiIonic,
  SiReact,
  SiKotlin,
  SiPython,
  SiPandas,
  SiScikitlearn,
  SiPhp,
  SiGit,
  SiSupabase,
} from 'react-icons/si'
import { VscCode } from 'react-icons/vsc'
import FadeIn from './FadeIn'

const CATEGORIES = [
  {
    title: 'Frontend',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.12)',
    skills: [
      { name: 'HTML5', icon: FaHtml5, color: '#e34f26' },
      { name: 'CSS3', icon: FaCss3Alt, color: '#1572b6' },
      { name: 'JavaScript', icon: SiJavascript, color: '#f7df1e' },
      { name: 'Tailwind CSS', icon: SiTailwindcss, color: '#06b6d4' },
      { name: 'Vue.js', icon: SiVuedotjs, color: '#42b883' },
      { name: 'Ionic', icon: SiIonic, color: '#3880ff' },
      { name: 'React', icon: SiReact, color: '#61dafb', badge: 'learning' },
    ],
  },
  {
    title: 'Mobile',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.12)',
    skills: [
      { name: 'Kotlin', icon: SiKotlin, color: '#7f52ff' },
    ],
  },
  {
    title: 'AI / Data',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.12)',
    skills: [
      { name: 'Python', icon: SiPython, color: '#3776ab' },
      { name: 'Pandas', icon: SiPandas, color: '#e6a817' },
      { name: 'Matplotlib', icon: FaChartLine, color: '#11557c' },
      { name: 'Scikit-learn', icon: SiScikitlearn, color: '#f7931e' },
    ],
  },
  {
    title: 'Backend',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.12)',
    skills: [
      { name: 'PHP', icon: SiPhp, color: '#777bb4' },
      { name: 'phpMyAdmin', icon: FaDatabase, color: '#f89820' },
    ],
  },
  {
    title: 'Tools',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.12)',
    skills: [
      { name: 'Git', icon: SiGit, color: '#f05032' },
      { name: 'GitHub', icon: FaGithub, color: '#f0f6fc' },
      { name: 'GitHub Copilot', icon: FaRobot, color: '#a78bfa' },
      { name: 'VS Code', icon: VscCode, color: '#007acc' },
      { name: 'Claude Code', icon: FaRobot, color: '#cc785c' },
      { name: 'Supabase', icon: SiSupabase, color: '#3ecf8e' },
    ],
  },
]

function SkillPill({ skill }) {
  const Icon = skill.icon
  return (
    <div
      className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 transition-all duration-200 hover:scale-105 hover:text-white relative cursor-default"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <Icon size={14} style={{ color: skill.color, flexShrink: 0 }} />
      <span className="text-[13px]">{skill.name}</span>
      {skill.badge && (
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
          style={{
            background: 'rgba(124,58,237,0.2)',
            color: '#a78bfa',
            border: '1px solid rgba(124,58,237,0.3)',
          }}
        >
          {skill.badge}
        </span>
      )}
    </div>
  )
}

export default function Skills() {
  return (
    <section id="skills" className="py-28 px-6">
      <div className="max-w-5xl mx-auto relative">
        <FadeIn>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>
            What I work with
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
            Skills
          </h2>
          <div className="h-px w-14 rounded mb-14" style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }} />
        </FadeIn>

        {/* Bento grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Frontend — large card spanning 2 cols */}
          <FadeIn delay={0} direction="up">
            <div
              className="rounded-2xl p-6 lg:col-span-2 h-full transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: `0 0 40px ${CATEGORIES[0].glow}`,
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORIES[0].color, boxShadow: `0 0 8px ${CATEGORIES[0].color}` }}
                />
                <h3
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: CATEGORIES[0].color, fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {CATEGORIES[0].title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES[0].skills.map((skill) => (
                  <SkillPill key={skill.name} skill={skill} />
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Mobile */}
          <FadeIn delay={0.06} direction="up">
            <div
              className="rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: `0 0 40px ${CATEGORIES[1].glow}`,
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORIES[1].color, boxShadow: `0 0 8px ${CATEGORIES[1].color}` }}
                />
                <h3
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: CATEGORIES[1].color, fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {CATEGORIES[1].title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES[1].skills.map((skill) => (
                  <SkillPill key={skill.name} skill={skill} />
                ))}
              </div>
            </div>
          </FadeIn>

          {/* AI / Data */}
          <FadeIn delay={0.1} direction="up">
            <div
              className="rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: `0 0 40px ${CATEGORIES[2].glow}`,
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORIES[2].color, boxShadow: `0 0 8px ${CATEGORIES[2].color}` }}
                />
                <h3
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: CATEGORIES[2].color, fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {CATEGORIES[2].title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES[2].skills.map((skill) => (
                  <SkillPill key={skill.name} skill={skill} />
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Backend */}
          <FadeIn delay={0.14} direction="up">
            <div
              className="rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: `0 0 40px ${CATEGORIES[3].glow}`,
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORIES[3].color, boxShadow: `0 0 8px ${CATEGORIES[3].color}` }}
                />
                <h3
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: CATEGORIES[3].color, fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {CATEGORIES[3].title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES[3].skills.map((skill) => (
                  <SkillPill key={skill.name} skill={skill} />
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Tools — spans full width */}
          <FadeIn delay={0.18} direction="up">
            <div
              className="rounded-2xl p-6 md:col-span-2 lg:col-span-3 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: `0 0 40px ${CATEGORIES[4].glow}`,
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORIES[4].color, boxShadow: `0 0 8px ${CATEGORIES[4].color}` }}
                />
                <h3
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: CATEGORIES[4].color, fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {CATEGORIES[4].title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES[4].skills.map((skill) => (
                  <SkillPill key={skill.name} skill={skill} />
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
