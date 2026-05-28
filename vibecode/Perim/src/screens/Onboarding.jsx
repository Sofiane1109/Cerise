import { useState } from 'react';

export default function Onboarding({ locations: initLocations = [], onSaveLocation, onDone }) {
  const [step, setStep] = useState(0);
  const [locations, setLocations] = useState(initLocations);
  const [tourStep, setTourStep] = useState(0);

  async function toggleLocation(id) {
    const loc = locations.find(l => l.id === id);
    const updated = { ...loc, enabled: !loc.enabled };
    setLocations(locs => locs.map(l => l.id === id ? updated : l));
    await onSaveLocation(updated);
  }

  function finish() {
    onDone();
  }

  return (
    <div className="onboard">
      {step > 0 && (
        <div className="onboard-progress">
          {[0, 1, 2].map(i => (
            <div key={i} className={`onboard-dot${i <= step - 1 ? ' active' : ''}`} />
          ))}
          <button
            onClick={finish}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)', marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            PASSER
          </button>
        </div>
      )}

      {step === 0 && <HeroStep onScan={() => { setStep(1); setTourStep(0); }} onManual={() => setStep(2)} />}
      {step === 1 && <TourStep tourStep={tourStep} onTourStep={setTourStep} onNext={() => setStep(2)} />}
      {step === 2 && <LocationsStep locations={locations} onToggle={toggleLocation} onDone={finish} />}
    </div>
  );
}

function HeroStep({ onScan, onManual }) {
  return (
    <>
      <div className="onboard-body">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 24, textAlign: 'center' }}>🥛</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            fontWeight: 700,
            lineHeight: 1.1,
            color: 'var(--black)',
            marginBottom: 20,
          }}>
            Bienvenue<br />chez <span style={{ color: 'var(--orange)' }}>Perim'</span>
          </h1>
          <div style={{ width: 40, height: 3, background: 'var(--orange)', borderRadius: 2, marginBottom: 24 }} />
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            color: 'var(--gray)',
            lineHeight: 1.5,
            fontWeight: 300,
          }}>
            Scanne tes courses, on s'occupe du reste. Plus de yaourts oubliés au fond du frigo.
          </p>
        </div>
      </div>
      <div className="onboard-footer">
        <button className="btn btn-primary" onClick={onScan}>
          Scanner mon premier produit
        </button>
        <button className="btn btn-secondary" onClick={onManual}>
          Ajouter à la main
        </button>
      </div>
    </>
  );
}

const TOUR_STEPS = [
  { num: '1', title: 'Scanne le code-barres', sub: 'en sortant les courses' },
  { num: '2', title: 'Note la date de péremption', sub: '3s, photo ou saisie' },
  { num: '3', title: 'On te prévient à temps', sub: '3 jours avant la fin', highlight: true },
];

function TourStep({ tourStep, onTourStep, onNext }) {
  return (
    <>
      <div className="onboard-body">
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {tourStep + 1} / 3
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--black)' }}>
            Comment ça marche
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TOUR_STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 'var(--r-lg)',
                border: `1.5px solid ${i === tourStep ? (s.highlight ? 'var(--orange)' : 'var(--black)') : 'var(--border)'}`,
                background: i === tourStep ? (s.highlight ? 'var(--orange-light)' : 'var(--cream-dark)') : 'var(--cream)',
                transition: 'all 0.2s',
              }}
            >
              <span style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: i === tourStep ? (s.highlight ? 'var(--orange)' : 'var(--black)') : 'var(--gray-light)',
                color: i === tourStep ? 'white' : 'var(--gray)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {s.num}
              </span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--black)' }}>{s.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="onboard-footer">
        <button
          className="btn btn-primary"
          onClick={() => tourStep < 2 ? onTourStep(tourStep + 1) : onNext()}
        >
          Continuer
        </button>
      </div>
    </>
  );
}

function LocationsStep({ locations, onToggle, onDone }) {
  return (
    <>
      <div className="onboard-body">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Étape 3 / 3 · Ton garde-manger
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--black)', marginBottom: 8, lineHeight: 1.2 }}>
          Où veux-tu ranger tes produits ?
        </h2>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--gray)', marginBottom: 24, lineHeight: 1.4, fontWeight: 300 }}>
          Choisis ou crée tes lieux de stockage. Tu peux en ajouter plus tard.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {locations.map(loc => (
            <label key={loc.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--r-lg)',
              border: '1.5px solid var(--border)',
              background: 'var(--cream)',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--black)' }}>{loc.name}</span>
              <label className="toggle">
                <input type="checkbox" checked={loc.enabled} onChange={() => onToggle(loc.id)} />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
            </label>
          ))}
          <button style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 16px',
            borderRadius: 'var(--r-lg)',
            border: '1.5px dashed var(--border-dash)',
            background: 'transparent',
            fontSize: 14,
            color: 'var(--gray)',
            cursor: 'pointer',
          }}>
            + nouveau lieu
          </button>
        </div>
      </div>
      <div className="onboard-footer">
        <button className="btn btn-primary" onClick={onDone}>
          C'est parti !
        </button>
      </div>
    </>
  );
}
