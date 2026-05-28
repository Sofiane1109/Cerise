import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { MOCK_BARCODES } from '../store.js';

const isNative = Capacitor.isNativePlatform();

export default function ScanScreen({ onClose, onProductFound, onManual }) {
  const [code, setCode] = useState('');
  const [found, setFound] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNative) startNativeScan();
  }, []);

  async function startNativeScan() {
    setScanning(true);
    setError('');
    try {
      const perms = await BarcodeScanner.requestPermissions();
      if (perms.camera !== 'granted') {
        setError('Permission caméra refusée');
        setScanning(false);
        return;
      }
      const { barcodes } = await BarcodeScanner.scan({
        formats: [
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.Code128,
        ],
      });
      if (barcodes.length > 0) {
        handleBarcode(barcodes[0].rawValue);
      }
    } catch (err) {
      setError('Scan annulé');
    } finally {
      setScanning(false);
    }
  }

  function handleBarcode(rawCode) {
    const product = MOCK_BARCODES[rawCode.trim()];
    if (product) {
      setFound({ ...product, barcode: rawCode.trim() });
      setCode(rawCode.trim());
    } else {
      onManual({ name: '', barcode: rawCode.trim() });
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    handleBarcode(code);
  }

  function handleNext() {
    if (found) onProductFound(found);
  }

  return (
    <div className="scan-screen">
      <div className="scan-header">
        <button onClick={onClose} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ✕ FERMER
        </button>
        <span className="scan-title">Scan</span>
        <button
          className="scan-btn-text"
          onClick={isNative ? startNativeScan : undefined}
        >
          FLASH
        </button>
      </div>

      <div className="scan-viewfinder">
        {scanning ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Ouverture du scanner…</p>
          </div>
        ) : (
          <div className="scan-frame">
            <span className="scan-corner tl" />
            <span className="scan-corner tr" />
            <span className="scan-corner bl" />
            <span className="scan-corner br" />
            {!found && <div className="scan-line" />}
            <span className="scan-hint">
              {isNative ? 'Appuie sur FLASH pour scanner' : 'aligne le code-barres'}
            </span>
          </div>
        )}
        {error && (
          <p style={{ position: 'absolute', bottom: 20, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--orange)' }}>
            {error}
          </p>
        )}
      </div>

      <div className="scan-bottom">
        {found && (
          <div className="scan-found-card">
            <div className="scan-found-img">📦</div>
            <div>
              <div className="scan-found-name">{found.name}</div>
              <div className="scan-found-meta">{found.brand} · {found.barcode}</div>
            </div>
            <span className="scan-found-badge">TROUVÉ</span>
          </div>
        )}

        <form className="scan-input-row" onSubmit={handleManualSubmit}>
          <input
            className="scan-code-input"
            placeholder="ex. 3033490004743"
            value={code}
            onChange={e => setCode(e.target.value)}
            inputMode="numeric"
          />
          <button type="submit" className="scan-input-submit">OK</button>
        </form>

        {found ? (
          <button className="btn btn-primary" style={{ background: 'white', color: 'var(--black)' }} onClick={handleNext}>
            Suivant →
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            onClick={() => onManual({ name: '' })}
          >
            Ajouter à la main
          </button>
        )}
      </div>
    </div>
  );
}
