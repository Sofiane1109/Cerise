import { useState, useEffect } from 'react';
import './App.css';

import { getOrCreateUser } from './supabase.js';
import {
  fetchProducts, addProduct, updateProduct,
  fetchLocations, saveLocation,
  isOnboarded, setOnboarded, genId, getTodayStr,
} from './store.js';
import { requestNotificationPermission, scheduleExpiryNotifications } from './notifications.js';

import BottomNav from './components/BottomNav.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Dashboard from './screens/Dashboard.jsx';
import ScanScreen from './screens/ScanScreen.jsx';
import AddManual from './screens/AddManual.jsx';
import ProductDetail from './screens/ProductDetail.jsx';
import StockScreen from './screens/StockScreen.jsx';
import StatsScreen from './screens/StatsScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboardedState] = useState(isOnboarded);
  const [tab, setTab] = useState('home');
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  const [showScan, setShowScan] = useState(false);
  const [addInitial, setAddInitial] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Init: auth + load data
  useEffect(() => {
    async function init() {
      try {
        const u = await getOrCreateUser();
        setUser(u);
        const [prods, locs] = await Promise.all([
          fetchProducts(u.id),
          fetchLocations(u.id),
        ]);
        setProducts(prods);
        setLocations(locs);
        const granted = await requestNotificationPermission();
        if (granted) scheduleExpiryNotifications(prods);
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleAddProduct(product) {
    const newProduct = { ...product, id: genId(), addedDate: getTodayStr(), status: 'active' };
    await addProduct(newProduct, user.id);
    const updated = [...products, newProduct];
    setProducts(updated);
    scheduleExpiryNotifications(updated);
    setAddInitial(null);
    setShowScan(false);
  }

  async function handleEaten(id, delta = 0) {
    const product = products.find(p => p.id === id);
    let updates;
    if (delta === -1 && product.quantity > 1) {
      updates = { quantity: product.quantity - 1 };
    } else {
      updates = { status: 'eaten' };
    }
    await updateProduct(id, updates, user.id);
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    setProducts(updated);
    setSelectedProduct(null);
  }

  async function handleThrown(id) {
    await updateProduct(id, { status: 'thrown' }, user.id);
    const updated = products.map(p => p.id === id ? { ...p, status: 'thrown' } : p);
    setProducts(updated);
    setSelectedProduct(null);
  }

  async function handleSaveLocation(location) {
    await saveLocation(location, user.id);
    setLocations(locs => locs.map(l => l.id === location.id ? location : l));
  }

  function handleNavigate(nextTab) {
    if (nextTab === 'scan') {
      setShowScan(true);
    } else {
      setTab(nextTab);
    }
  }

  function handleScanProductFound(found) {
    setShowScan(false);
    setAddInitial({ name: found.name, brand: found.brand, type: found.type });
  }

  function handleDoneOnboarding() {
    setOnboarded();
    setOnboardedState(true);
  }

  if (loading) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--cream)', gap: 16,
      }}>
        <span style={{ fontSize: 48 }}>🥛</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--black)' }}>
          Perim'
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)' }}>
          Chargement…
        </span>
      </div>
    );
  }

  if (!onboarded) {
    return <Onboarding locations={locations} onSaveLocation={handleSaveLocation} onDone={handleDoneOnboarding} />;
  }

  return (
    <>
      {tab === 'home' && (
        <Dashboard
          products={products}
          onProductClick={setSelectedProduct}
          onAddClick={() => setAddInitial({})}
        />
      )}
      {tab === 'stock' && (
        <StockScreen
          products={products}
          onProductClick={setSelectedProduct}
          onAddClick={() => setAddInitial({})}
        />
      )}
      {tab === 'stats' && <StatsScreen products={products} />}
      {tab === 'profile' && (
        <ProfileScreen
          products={products}
          locations={locations}
          onSaveLocation={handleSaveLocation}
        />
      )}

      {!showScan && !addInitial && !selectedProduct && (
        <BottomNav active={tab} onNavigate={handleNavigate} />
      )}

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEaten={handleEaten}
          onThrown={handleThrown}
        />
      )}

      {addInitial !== null && (
        <AddManual
          initial={addInitial}
          locations={locations}
          onSave={handleAddProduct}
          onClose={() => setAddInitial(null)}
        />
      )}

      {showScan && (
        <ScanScreen
          onClose={() => setShowScan(false)}
          onProductFound={handleScanProductFound}
          onManual={(initial) => { setShowScan(false); setAddInitial(initial || {}); }}
        />
      )}
    </>
  );
}
