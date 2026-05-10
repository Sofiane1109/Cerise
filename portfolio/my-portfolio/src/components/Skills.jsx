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
    skills: [
      { name: 'Kotlin', icon: SiKotlin, color: '#7f52ff' },
    ],
  },
  {
    title: 'AI / Data',
    color: '#f59e0b',
    skills: [
      { name: 'Python', icon: SiPython, color: '#3776ab' },
      { name: 'Pandas', icon: SiPandas, color: '#130754' },
      { name: 'Matplotlib', icon: FaChartLine, color: '#11557c' },
      { name: 'Scikit-learn', icon: SiScikitlearn, color: '#f7931e' },
    ],
  },
  {
    title: 'Backend',
    color: '#10b981',
    skills: [
      { name: 'PHP', icon: SiPhp, color: '#777bb4' },
      { name: 'phpMyAdmin', icon: FaDatabase, color: '#f89820' },
    ],
  },
  {
    title: 'Tools',
    color: '#ec4899',
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
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 transition-all duration-200 hover:scale-105 relative"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <Icon size={15} style={{ color: skill.color, flexShrink: 0 }} />
      <span>{skill.name}</span>
      {skill.badge && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(124,58,237,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-5xl mx-auto relative">
        <FadeIn>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: '#a78bfa' }}
          >
            What I work with
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
            Skills
          </h2>
          <div
            className="h-px w-14 rounded mb-14"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
          />
        </FadeIn>

        <div className="space-y-10">
          {CATEGORIES.map((cat, ci) => (
            <FadeIn key={cat.title} delay={ci * 0.08}>
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: cat.color, boxShadow: `0 0 8px ${cat.color}` }}
                  />
                  <h3
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: cat.color }}
                  >
                    {cat.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill) => (
                    <SkillPill key={skill.name} skill={skill} />
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
