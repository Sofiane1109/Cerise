import FadeIn from './FadeIn'

export default function About() {
  return (
    <section id="about" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: '#a78bfa' }}
          >
            Who I am
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
            About me
          </h2>
          <div
            className="h-px w-14 rounded mb-14"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
          />
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <FadeIn delay={0.1} direction="left">
            <div className="space-y-5 text-slate-400 leading-relaxed text-[15px]">
              <p>
                I&apos;m a Computer Science student specialising in AI & Data Engineering,
                Web & Mobile Development, and Digital Consulting — building real projects
                that solve everyday problems.
              </p>
              <p className="italic text-slate-500">
                {/* [BIO] — Replace this paragraph with your personal story */}
                [BIO] — Write a few sentences about yourself here: your background, what drives you,
                what kind of projects excite you, and where you want to go.
              </p>
              <p>
                My focus spans{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}
                >
                  AI & Data Engineering
                </span>
                ,{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}
                >
                  Web & Mobile Development
                </span>
                , and{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}
                >
                  Digital Consulting
                </span>
                .
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} direction="right">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Focus', value: 'Web & Mobile' },
                { label: 'Passion', value: 'AI & Data' },
                { label: 'Based in', value: 'Belgium' },
                { label: 'Status', value: 'Open to work' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-semibold text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
