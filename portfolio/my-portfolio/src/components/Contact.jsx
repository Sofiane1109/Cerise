import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa'
import FadeIn from './FadeIn'

const fieldStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  caretColor: '#7c3aed',
}
const fieldFocusStyle = { border: '1px solid rgba(124,58,237,0.5)' }
const fieldBlurStyle = { border: '1px solid rgba(255,255,255,0.08)' }

function InputField({ label, id, type = 'text', textarea = false, value, onChange }) {
  const shared = {
    id,
    name: id,
    value,
    onChange,
    required: true,
    className: 'w-full rounded-xl px-4 py-3 text-sm text-slate-200 outline-none resize-none transition-colors duration-150',
    style: fieldStyle,
    onFocus: (e) => Object.assign(e.target.style, fieldFocusStyle),
    onBlur: (e) => Object.assign(e.target.style, fieldBlurStyle),
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#475569' }}
      >
        {label}
      </label>
      {textarea ? <textarea {...shared} rows={5} /> : <input type={type} {...shared} />}
    </div>
  )
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    // Wire this up to Formspree, Resend, or your own backend
    await new Promise((r) => setTimeout(r, 900))
    setSending(false)
    setSent(true)
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <section id="contact" className="py-28 px-6">
      <div className="max-w-xl mx-auto">
        <FadeIn>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: '#a78bfa' }}
          >
            Let&apos;s work together
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
            Get in touch
          </h2>
          <div
            className="h-px w-14 rounded mb-5"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
          />
          <p className="text-slate-400 text-sm leading-relaxed mb-12">
            Have a project in mind, a question, or just want to say hi? Feel free to reach out.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-8 text-center"
                style={{
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(124,58,237,0.2)' }}
                >
                  <span className="text-violet-400 text-xl font-bold">✓</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Message sent!</h3>
                <p className="text-slate-400 text-sm">I&apos;ll get back to you as soon as possible.</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-xs text-slate-600 hover:text-slate-300 transition-colors"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                <InputField label="Name" id="name" value={form.name} onChange={handleChange} />
                <InputField label="Email" id="email" type="email" value={form.email} onChange={handleChange} />
                <InputField label="Message" id="message" textarea value={form.message} onChange={handleChange} />

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-2 py-3.5 rounded-full font-semibold text-sm text-white transition-all duration-300 hover:brightness-110 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                    boxShadow: '0 0 20px rgba(124,58,237,0.3)',
                  }}
                >
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </FadeIn>

        <FadeIn delay={0.25}>
          <div className="flex items-center justify-center gap-6 mt-14">
            <a
              href="mailto:sofiane.ennali@student.odisee.be"
              className="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors duration-200"
            >
              <FaEnvelope size={15} />
              <span>Email</span>
            </a>
            <span className="text-slate-800">·</span>
            <a
              href="https://github.com/Sofiane1109"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors duration-200"
            >
              <FaGithub size={15} />
              <span>GitHub</span>
            </a>
            <span className="text-slate-800">·</span>
            <a
              href="https://www.linkedin.com/in/sofiane-en-nali/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-blue-400 text-sm transition-colors duration-200"
            >
              <FaLinkedin size={15} />
              <span>LinkedIn</span>
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
