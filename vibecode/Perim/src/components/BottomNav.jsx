export default function BottomNav({ active, onNavigate }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'scan', label: 'Scan', icon: '⬡' },
    { id: 'stock', label: 'Stock', icon: '☰' },
    { id: 'stats', label: 'Stats', icon: '◎' },
    { id: 'profile', label: 'Moi', icon: '◉' },
  ];

  return (
    <nav style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: 72,
      background: 'var(--cream)',
      borderTop: '1.5px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '8px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: active === tab.id ? 'var(--black)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            color: active === tab.id ? 'var(--white)' : 'var(--gray)',
            transition: 'all 0.15s',
          }}>
            {tab.icon}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 500,
            color: active === tab.id ? 'var(--black)' : 'var(--gray)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
