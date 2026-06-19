import FadeIn from './FadeIn'

const STATS = [
  { value: '3+', label: 'Years coding' },
  { value: '5+', label: 'Projects built' },
  { value: '3', label: 'Specialisations' },
]

const INFO = [
  { label: 'Focus', value: 'Web & Mobile' },
  { label: 'Passion', value: 'AI & Data' },
  { label: 'Based in', value: 'Belgium' },
  { label: 'Status', value: 'Open to work', highlight: true },
]

export default function About() {
  return (
    <section id="about" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">

        <FadeIn>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>
            Who I am
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
            About me
          </h2>
          <div className="h-px w-14 rounded mb-14" style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }} />
        </FadeIn>

        {/* Stats row */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-3 gap-4 mb-14">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl p-5 text-center"
                style={{
                  background: 'rgba(124,58,237,0.06)',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}
              >
                <p
                  className="text-3xl md:text-4xl font-bold mb-1"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {value}
                </p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <FadeIn delay={0.1} direction="left">
            <div className="space-y-5 text-slate-400 leading-relaxed text-[15px]">
              <p>
                I&apos;m a Computer Science student specialising in AI & Data Engineering,
                Web & Mobile Development, and Digital Consulting — building real projects
                that solve everyday problems.
              </p>
              <p>
                My focus spans{' '}
                <span className="font-semibold" style={{ color: '#a78bfa' }}>AI & Data Engineering</span>,{' '}
                <span className="font-semibold" style={{ color: '#a78bfa' }}>Web & Mobile Development</span>,
                and{' '}
                <span className="font-semibold" style={{ color: '#a78bfa' }}>Digital Consulting</span>.
                I love turning ideas into polished, functional products.
              </p>
              <p>
                Outside of code, you&apos;ll find me on hiking trails, playing futsal, or
                tinkering with the latest frameworks and tools.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} direction="right">
            <div className="grid grid-cols-2 gap-3">
              {INFO.map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className="rounded-xl p-4 transition-all duration-300"
                  style={{
                    background: highlight ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                    border: highlight
                      ? '1px solid rgba(34,197,94,0.2)'
                      : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5">{label}</p>
                  <div className="flex items-center gap-2">
                    {highlight && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
                      />
                    )}
                    <p
                      className="text-sm font-semibold"
                      style={{ color: highlight ? '#86efac' : '#e2e8f0' }}
                    >
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
