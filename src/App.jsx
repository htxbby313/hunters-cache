import { useState, useEffect } from 'react'
import './index.css'

const API_BASE = window.location.origin;

/* ---------- Auth Helpers ---------- */
function getToken() { return localStorage.getItem('hc_token'); }
function setToken(t) { if (t) localStorage.setItem('hc_token', t); else localStorage.removeItem('hc_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('hc_user')); } catch { return null; } }
function setUser(u) { if (u) localStorage.setItem('hc_user', JSON.stringify(u)); else localStorage.removeItem('hc_user'); }
function authHeaders() { const t = getToken(); return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }; }

async function apiCall(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ---------- SVG Icon ---------- */
const Icon = ({ id, size = 24 }) => (
  <svg width={size} height={size} style={{ fill: 'currentColor' }}>
    <use href={`/icons.svg#${id}`} />
  </svg>
)

/* ---------- Stars ---------- */
const Stars = ({ rating }) => (
  <span className="item-card-rating">
    {[1,2,3,4,5].map(i => <Icon key={i} id="star-icon" size={14} />)}
    <span style={{ marginLeft: 4 }}>{rating || '5.0'}</span>
  </span>
)

const Toggle = ({ name, checked, onChange }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={`${name} notifications`}
    className={`toggle-switch ${checked ? 'on' : ''}`} onClick={() => onChange(name, !checked)}>
    <span className="knob" />
  </button>
)

const mapCategoryIcon = (catId) => {
  const m = { 'waterfowl': 'waterfowl-icon', 'big-game': 'biggame-icon', 'turkey': 'turkey-icon', 'upland-bird': 'fishing-icon', 'small-game-varmint': 'turkey-icon', 'bowhunting': 'firearm-icon', 'technical-apparel': 'apparel-icon', 'firearms': 'firearm-icon' }
  return m[catId] || 'star-icon'
}

/* ============================================================
   MOCK DATA
   ============================================================ */
const MOCK_REGIONS = ['Northeast', 'Southeast', 'Midwest', 'West/Rockies', 'Southwest', 'Pacific NW']

const MOCK_CATEGORIES = [
  { id: 'waterfowl', name: 'Waterfowl' },
  { id: 'big-game', name: 'Big Game' },
  { id: 'turkey', name: 'Turkey' },
  { id: 'upland-bird', name: 'Upland Bird' },
  { id: 'small-game-varmint', name: 'Varmint' },
  { id: 'bowhunting', name: 'Bowhunting' },
  { id: 'technical-apparel', name: 'Apparel' },
]

const MOCK_LISTINGS = [
  { id: 'm1', title: 'Benelli SBE 3', game_category: 'waterfowl', region: 'Southeast', price: 1895, is_firearm: true, description: '12ga semi-auto, 28" barrel, excellent condition.' },
  { id: 'm2', title: 'Sitka Delta Waders', game_category: 'technical-apparel', region: 'Pacific NW', price: 399, is_firearm: false, description: 'Men\'s large, used one season.' },
  { id: 'm3', title: 'Vortex Razor HD 10x42', game_category: 'big-game', region: 'West/Rockies', price: 1299, is_firearm: false, description: 'Premium binoculars, like new.' },
  { id: 'm4', title: 'Avian-X Duck Decoys (6)', game_category: 'waterfowl', region: 'Southeast', price: 175, is_firearm: false, description: 'Full body mallard decoys.' },
  { id: 'm5', title: 'Mathews Phase4 Bow', game_category: 'bowhunting', region: 'Midwest', price: 1099, is_firearm: false, description: '70lb draw, 29" draw length.' },
  { id: 'm6', title: 'Remington 870 Express', game_category: 'waterfowl', region: 'Midwest', price: 450, is_firearm: true, description: '12ga pump, 28" barrel.' },
]

const SEASONAL_DATA = {
  'Southeast': [
    { game: 'Whitetail Deer', season: 'Archery: Sep-Oct · Gun: Nov-Jan', icon: 'biggame-icon', bg: '#2d5a27', desc: 'Peak rut in November. Focus on food plots and oak flats.', tags: ['Archery', 'Rifle', 'Food Plots'] },
    { game: 'Eastern Turkey', season: 'Mar-May', icon: 'turkey-icon', bg: '#5d4037', desc: 'Spring gobbler season. Birds are vocal on warm mornings.', tags: ['Spring', 'Calls', 'Decoys'] },
    { game: 'Waterfowl (Duck)', season: 'Nov-Jan', icon: 'waterfowl-icon', bg: '#37474f', desc: 'Mississippi Flyway. Flooded timber action peaks in December.', tags: ['Duck', 'Flooded Timber', 'Decoys'] },
    { game: 'Feral Hog', season: 'Year-round', icon: 'biggame-icon', bg: '#c85a17', desc: 'No bag limits. Night hunting with thermal optics is effective.', tags: ['Year-round', 'Night Hunt', 'Thermal'] },
  ],
  'West/Rockies': [
    { game: 'Elk (Rocky Mtn)', season: 'Archery: Aug-Sep · Rifle: Oct-Nov', icon: 'biggame-icon', bg: '#2d5a27', desc: 'Bugling season in September. Alpine and high timber.', tags: ['Archery', 'Rifle', 'Backcountry'] },
    { game: 'Mule Deer', season: 'Sep-Nov', icon: 'biggame-icon', bg: '#5d4037', desc: 'High desert to alpine transitions. Glassing is key.', tags: ['Rifle', 'Optics', 'Spot & Stalk'] },
    { game: 'Pronghorn Antelope', season: 'Aug-Oct', icon: 'biggame-icon', bg: '#37474f', desc: 'Open prairie hunting. Long-range shots common.', tags: ['Long Range', 'Prairie', 'Spot & Stalk'] },
    { game: 'Moose', season: 'Sep-Oct', icon: 'biggame-icon', bg: '#c85a17', desc: 'Limited tags. High country and willow bottoms.', tags: ['Limited Entry', 'Backcountry', 'Rifle'] },
  ],
  'Midwest': [
    { game: 'Whitetail Deer', season: 'Archery: Oct-Nov · Gun: Nov-Dec', icon: 'biggame-icon', bg: '#2d5a27', desc: 'Corn and soybean country. Big bucks in river bottoms.', tags: ['Archery', 'Rifle', 'River Bottoms'] },
    { game: 'Wild Turkey', season: 'Apr-May', icon: 'turkey-icon', bg: '#5d4037', desc: 'Eastern subspecies. River drainages and oak ridges.', tags: ['Spring', 'Calls', 'Decoys'] },
    { game: 'Pheasant', season: 'Oct-Jan', icon: 'fishing-icon', bg: '#37474f', desc: 'Public land walk-up hunting. CRP fields and shelterbelts.', tags: ['Upland', 'Shotgun', 'Dogs'] },
  ],
  'Northeast': [
    { game: 'Whitetail Deer', season: 'Archery: Oct-Nov · Gun: Nov-Dec', icon: 'biggame-icon', bg: '#2d5a27', desc: 'Big woods hunting. Track heavy snow for mature bucks.', tags: ['Archery', 'Rifle', 'Big Woods'] },
    { game: 'Black Bear', season: 'Sep-Nov', icon: 'biggame-icon', bg: '#5d4037', desc: 'Baited or hound hunting in certain states.', tags: ['Bear', 'Bait', 'Hounds'] },
    { game: 'Ruffed Grouse', season: 'Oct-Dec', icon: 'fishing-icon', bg: '#37474f', desc: 'Aspen thickets and early successional forest.', tags: ['Upland', 'Shotgun', 'Dogs'] },
  ],
  'Southwest': [
    { game: 'Coues Deer', season: 'Dec-Jan', icon: 'biggame-icon', bg: '#2d5a27', desc: 'Small framed but wary. Glassing from distance.', tags: ['Rifle', 'Spot & Stalk', 'Glass'] },
    { game: 'Javelina', season: 'Jan-Mar', icon: 'biggame-icon', bg: '#5d4037', desc: 'Desert pig. Spot and stalk in cactus country.', tags: ['Spot & Stalk', 'Desert', 'Rifle'] },
    { game: "Gould's Turkey", season: 'Apr-May', icon: 'turkey-icon', bg: '#37474f', desc: 'Mountain turkey. Remote and challenging.', tags: ['Spring', 'Mountain', 'Calls'] },
  ],
  'Pacific NW': [
    { game: 'Roosevelt Elk', season: 'Sep-Nov', icon: 'biggame-icon', bg: '#2d5a27', desc: 'Rainforest elk. Dense cover, close shots.', tags: ['Rifle', 'Rainforest', 'Archery'] },
    { game: 'Blacktail Deer', season: 'Aug-Nov', icon: 'biggame-icon', bg: '#5d4037', desc: 'Coastal and cascade ranges. Thick cover hunting.', tags: ['Rifle', 'Archery', 'Coastal'] },
    { game: 'Waterfowl', season: 'Oct-Jan', icon: 'waterfowl-icon', bg: '#37474f', desc: 'Pacific Flyway. Coastal estuaries and flooded fields.', tags: ['Duck', 'Goose', 'Estuaries'] },
  ],
}

/* ============================================================
   MY ORDERS VIEW
   ============================================================ */
const MyOrdersView = () => {
  const [filterStatus, setFilterStatus] = useState('all')
  const [orders, setOrders] = useState([])
  const [notice, setNotice] = useState('')
  useEffect(() => { if (getToken()) apiCall('/api/orders/mine').then(setOrders).catch(error => setNotice(error.message)) }, [])
  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus)
  const updateOrder = async (order, status) => {
    try { const updated = await apiCall(`/api/orders/${order.id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); setOrders(rows => rows.map(row => row.id === order.id ? { ...row, ...updated } : row)) }
    catch (error) { setNotice(error.message) }
  }
  const openDispute = async (order) => {
    const reason = window.prompt('Dispute reason (for example: not received, not as described, transfer rejected)')
    if (!reason) return
    const details = window.prompt('Describe what happened and the resolution you are requesting (at least 20 characters)')
    if (!details) return
    try { await apiCall(`/api/orders/${order.id}/disputes`, { method: 'POST', body: JSON.stringify({ reason, details }) }); setOrders(rows => rows.map(row => row.id === order.id ? { ...row, status: 'disputed' } : row)); setNotice('Dispute opened. Keep all communication and evidence in the marketplace.') }
    catch (error) { setNotice(error.message) }
  }

  return (
    <div className="profile-page">
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>My Orders</h2>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        {['all','payment_pending','paid','shipped','delivered','completed','disputed'].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterStatus(s)} style={{ textTransform: 'capitalize' }}>
            {s === 'all' ? `All (${orders.length})` : `${s.replace('_',' ')} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <span className="order-num">{order.order_number}</span>
            <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className="order-body">
            <div className="order-icon"><Icon id={mapCategoryIcon(order.item_category)} size={24} /></div>
            <div className="order-details">
              <div className="item-name">{order.item_title}</div>
              <div className="item-sub">{order.ffl_name ? 'FFL transfer' : 'Standard shipping'} · GunTab: {order.provider_status || 'pending'}</div>
            </div>
            <div className="order-price-tag">${Number(order.total).toFixed(2)}</div>
          </div>

          <div className="tracking-status">
            <span className={`track-dot ${order.status}`} />
            <span className="tracking-text">
              {order.status === 'shipped' && <>Package <strong>shipped</strong> — tracking: {order.tracking_number}</>}
              {order.status === 'delivered' && <>Order marked <strong>delivered</strong></>}
              {!['shipped','delivered'].includes(order.status) && <>Order status: <strong>{order.status.replace('_',' ')}</strong></>}
            </span>
          </div>

          {order.ffl_name && (
            <div className="ffl-pickup-info">
              <Icon id="mappin-icon" size={18} />
              <div className="ffl-text">
                <strong>🔫 FFL Pickup Required</strong>
                Ship to: {order.ffl_name} — {order.ffl_address}. Bring valid ID for transfer.
              </div>
            </div>
          )}
          <div className="listing-actions" style={{marginTop:12}}>
            {order.status === 'shipped' && <button className="btn btn-primary btn-sm" onClick={() => updateOrder(order, 'delivered')}>Confirm delivery</button>}
            {order.status === 'delivered' && <button className="btn btn-primary btn-sm" onClick={() => updateOrder(order, 'completed')}>Accept order</button>}
            {['paid','shipped','delivered'].includes(order.status) && <button className="btn btn-outline btn-sm" onClick={() => openDispute(order)}>Open dispute</button>}
            {order.provider_checkout_url && order.status === 'payment_pending' && <button className="btn btn-primary btn-sm" onClick={() => window.location.assign(order.provider_checkout_url)}>Resume GunTab checkout</button>}
          </div>
        </div>
      ))}

      {notice && <div className="profile-notice">{notice}</div>}

      {filtered.length === 0 && (
        <div className="empty-state">
          <Icon id="orders-icon" size={48} /><h3>No orders found</h3>
          <p>You haven't placed any orders yet. Start browsing gear!</p>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   PROFILE SETTINGS VIEW
   ============================================================ */
const ProfileSettingsView = ({ currentUser }) => {
  const [region, setRegion] = useState(currentUser?.location || 'Southeast')
  const [notifications, setNotifications] = useState({ email: true, push: true, sms: false, weekly: true })

  return (
    <div style={{ marginTop: 'var(--space-md)' }}>
      <div className="settings-section">
        <h3>Hunting Preferences</h3>
        <div className="form-group">
          <label>Home Region</label>
          <select value={region} onChange={e => setRegion(e.target.value)}>
            {MOCK_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="hint">Your home region helps us show relevant gear and season info.</div>
        </div>
        <div className="form-group">
          <label>Primary Game (optional)</label>
          <select>
            <option>Waterfowl</option>
            <option>Big Game</option>
            <option>Turkey</option>
            <option>Upland Bird</option>
            <option>All</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notification Preferences</h3>
        <div className="toggle-row">
          <div><div className="toggle-label">Email Notifications</div><span className="toggle-desc">Order updates and receipts</span></div>
          <Toggle name="email" checked={notifications.email} onChange={(n,v) => setNotifications(p => ({...p, [n]: v}))} />
        </div>
        <div className="toggle-row">
          <div><div className="toggle-label">Push Notifications</div><span className="toggle-desc">Browser alerts for messages and offers</span></div>
          <Toggle name="push" checked={notifications.push} onChange={(n,v) => setNotifications(p => ({...p, [n]: v}))} />
        </div>
        <div className="toggle-row">
          <div><div className="toggle-label">SMS Updates</div><span className="toggle-desc">Text messages for shipping updates</span></div>
          <Toggle name="sms" checked={notifications.sms} onChange={(n,v) => setNotifications(p => ({...p, [n]: v}))} />
        </div>
        <div className="toggle-row">
          <div><div className="toggle-label">Weekly Digest</div><span className="toggle-desc">New gear and regional season alerts</span></div>
          <Toggle name="weekly" checked={notifications.weekly} onChange={(n,v) => setNotifications(p => ({...p, [n]: v}))} />
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <button className="btn btn-primary">Save Settings</button>
      </div>
    </div>
  )
}

/* ============================================================
   REGIONAL HUNTING GUIDE VIEW
   ============================================================ */
const RegionalGuideView = ({ onNavigate, items, currentUser }) => {
  const [selectedRegion, setSelectedRegion] = useState('Southeast')
  const seasons = SEASONAL_DATA[selectedRegion] || []

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); onNavigate('home') }}>
            <img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo" />
            <span className="navbar-title">Hunter's <span className="accent">Cache</span></span>
          </a>
          <div className="navbar-links">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home') }}>Browse</a>
            <a href="#" className="active">Hunting Guide</a>
            {currentUser && (
              <>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('sell') }}>Seller Dashboard</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('profile') }}>My Profile</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('messages') }}>Messages</a>
              </>
            )}
          </div>
          <div className="navbar-actions">
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('home')}>Browse Gear</button>
          </div>
        </div>
      </nav>

      <div className="profile-page">
        <div className="guide-hero">
          <img src="/assets/hero-banner.png" alt="Hunting terrain" />
          <div className="guide-overlay" />
          <div className="guide-hero-text">
            <span className="hero-badge">Regional Hunting Guide</span>
            <h2>{selectedRegion} Seasons</h2>
            <p>What's in season, where to hunt, and the gear you'll need.</p>
          </div>
        </div>

        <div className="guide-region-selector">
          {MOCK_REGIONS.map(r => (
            <span key={r} className={`region-pill ${selectedRegion === r ? 'active' : ''}`}
              onClick={() => setSelectedRegion(r)}>
              <Icon id="region-icon" size={14} style={{ marginRight: 4 }} />{r}
            </span>
          ))}
        </div>

        <div className="guide-info-panel">
          <div className="guide-info-item"><div className="info-num">{seasons.length}</div><div className="info-label">Game Species</div></div>
          <div className="guide-info-item"><div className="info-num">Nationwide</div><div className="info-label">Marketplace Reach</div></div>
          <div className="guide-info-item"><div className="info-num">{items.filter(item => item.region === selectedRegion).length}</div><div className="info-label">Active Listings</div></div>
        </div>

        <h3 style={{ marginBottom: 'var(--space-md)' }}>What's in Season</h3>
        <div className="season-grid">
          {seasons.map((s, i) => (
            <div key={i} className="season-card">
              <div className="season-icon" style={{ background: s.bg }}>
                <Icon id={s.icon} size={26} />
              </div>
              <h3>{s.game}</h3>
              <div className="season-dates">{s.season}</div>
              <div className="season-desc">{s.desc}</div>
              <div className="season-tags">
                {s.tags.map(t => <span key={t} className="season-tag">{t}</span>)}
                <span className="season-tag" style={{ background: 'rgba(200,90,23,0.2)', color: '#c85a17', cursor: 'pointer' }}
                  onClick={() => onNavigate('home')}>
                  Browse Gear →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ============================================================
   BUYER PROFILE (TABBED: Orders + Settings)
   ============================================================ */
const BuyerProfileView = ({ onNavigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState('orders')
  const displayName = currentUser?.displayName || currentUser?.display_name || 'Hunter'
  const location = currentUser?.location || 'USA'
  const initials = displayName.split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'HC'

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); onNavigate('home') }}>
            <img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo" />
            <span className="navbar-title">Hunter's <span className="accent">Cache</span></span>
          </a>
          <div className="navbar-links">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home') }}>Browse</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('guide') }}>Hunting Guide</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('sell') }}>Seller Dashboard</a>
            <a href="#" className="active">My Profile</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('messages') }}>Messages</a>
          </div>
          <div className="navbar-actions">
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('home')}>← Back</button>
          </div>
        </div>
      </nav>

      <div className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar-large">{initials}</div>
          <div className="profile-info">
            <h1>{displayName}</h1>
            <p className="tagline">{location} · Member Account</p>
          </div>
        </div>

        <div className="tab-bar">
          <div className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Icon id="orders-icon" size={16} /> My Orders
          </div>
          <div className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Icon id="settings-icon" size={16} /> Settings
          </div>
          <div className={`tab-item`} onClick={() => onNavigate('guide')}>
            <Icon id="compass-icon" size={16} /> Hunting Guide
          </div>
        </div>

        {activeTab === 'orders' && <MyOrdersView />}
        {activeTab === 'settings' && <ProfileSettingsView currentUser={currentUser} />}
      </div>
    </>
  )
}

/* ============================================================
   CHECKOUT VIEW (condensed)
   ============================================================ */
const CHECKOUT_STEPS = ['Shipping', 'Payment', 'Order Review']

const CheckoutView = ({ item, onBack, onNavigate }) => {
  const [step, setStep] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [providerStatus, setProviderStatus] = useState(null)
  const [fflZip, setFflZip] = useState('')
  const [fflDealers, setFflDealers] = useState([])
  const [fflSearching, setFflSearching] = useState(false)
  const orderNumber = createdOrder?.orderNumber || `HC-DEMO-${String(item?.id || 'ORDER').toUpperCase()}`
  const isFirearm = item?.is_firearm || false
  const [form, setForm] = useState({ fullName: '', address: '', city: '', state: '', zip: '', selectedFFL: null, agreed: false })
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const shippingValid = isFirearm ? form.selectedFFL !== null : form.fullName && form.address && form.city && form.state && form.zip
  const paymentValid = Boolean(providerStatus?.payment?.configured)
  useEffect(() => {
    apiCall('/api/providers/status').then(setProviderStatus).catch(() => setProviderStatus(null))
  }, [])
  const searchFfl = async () => {
    setCheckoutError(''); setFflSearching(true)
    try {
      const result = await apiCall('/api/ffl/search', { method: 'POST', body: JSON.stringify({ zipcode: fflZip, radius: 25 }) })
      const rows = Array.isArray(result) ? result : result.ffls || result.data || result.results || []
      setFflDealers(rows.map((dealer, index) => ({ id: dealer.id || dealer.license_number || index, name: dealer.business_name || dealer.name || dealer.license_name || 'Licensed dealer', addr: dealer.premise_address || dealer.address || [dealer.street, dealer.city, dealer.state, dealer.zip].filter(Boolean).join(', '), dist: dealer.distance ? `${dealer.distance} mi` : '', licenseNumber: dealer.license_number || dealer.lic_number || dealer.ffl_number, license: dealer.license_number || dealer.lic_number || dealer.ffl_number })))
    } catch (error) { setCheckoutError(error.message) }
    finally { setFflSearching(false) }
  }
  const placeOrder = async () => {
    setCheckoutError('')
    if (!getToken()) { setCheckoutError('Sign in before creating an order.'); return }
    setSubmitting(true)
    try {
      const order = await apiCall('/api/orders', { method: 'POST', body: JSON.stringify({
        listingId: item.id,
        shipping: { name: form.fullName, address: form.address, city: form.city, state: form.state, zip: form.zip },
        ffl: form.selectedFFL,
      }) })
      setCreatedOrder(order)
      setConfirmed(true)
    } catch (error) { setCheckoutError(error.message) }
    finally { setSubmitting(false) }
  }

  if (confirmed) {
    return (
      <>
        <div className="checkout-nav">
          <div className="checkout-nav-inner">
            <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); onBack() }}>
              <img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo" style={{ width: 32, height: 32 }} />
              <span className="navbar-title" style={{ fontSize: '1.25rem' }}>Hunter's <span className="accent">Cache</span></span>
            </a>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('home')}>Continue Shopping</button>
          </div>
        </div>
        <div className="confirmation-view">
          <div className="success-icon"><Icon id="checkcircle-icon" size={44} /></div>
          <h1>Order Saved</h1>
          <p>{createdOrder?.message || 'This order is waiting for payment-provider configuration before fulfillment.'}</p>
          <div className="confirmation-details">
            <div className="detail-row"><span className="detail-label">Order #</span><span className="detail-value">{orderNumber}</span></div>
            <div className="detail-row"><span className="detail-label">Item</span><span className="detail-value">{item.title}</span></div>
            <div className="detail-row"><span className="detail-label">Ship To</span><span className="detail-value">{isFirearm ? form.selectedFFL?.name : `${form.city}, ${form.state}`}</span></div>
            <div className="detail-row"><span className="detail-label">Total</span><span className="detail-value">${(item.price + 12.99).toFixed(2)}</span></div>
          </div>
          {createdOrder?.checkoutUrl && <button className="btn btn-primary btn-lg" onClick={() => window.location.assign(createdOrder.checkoutUrl)}>Continue to GunTab →</button>}
          <button className="btn btn-outline" onClick={() => onNavigate('home')}>Back to Browse</button>
        </div>
      </>
    )
  }

  return (
    <div className="checkout-view">
      <div className="checkout-nav">
        <div className="checkout-nav-inner">
          <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); onBack() }}>
            <img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo" style={{ width: 32, height: 32 }} />
            <span className="navbar-title" style={{ fontSize: '1.25rem' }}>Checkout</span>
          </a>
          <div className="security-badge" style={{ marginBottom: 0 }}><Icon id="lock-icon" size={14} /> Secure Checkout</div>
        </div>
      </div>

      <div className="checkout-body">
        <div className="checkout-main">
          <div className="profile-notice" style={{ marginBottom: 'var(--space-lg)' }}>
            <strong>Purchases are not available yet.</strong> Online checkout is disabled during our browsing-and-listing beta while bank and identity verification is pending. Orders cannot be submitted at this time. Please message the seller directly.
          </div>
          <div className="checkout-steps">
            {CHECKOUT_STEPS.map((s, i) => (
              <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className={`chk-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}><span className="step-dot" /> {s}</span>
                {i < CHECKOUT_STEPS.length - 1 && <span className={`chk-connector ${i < step ? 'completed' : ''}`} />}
              </span>
            ))}
          </div>

          {step === 0 && (
            <div className="checkout-section">
              <div className="section-title">{isFirearm ? <Icon id="mappin-icon" size={20} /> : <Icon id="shipping-icon" size={20} />}{isFirearm ? 'Select FFL Dealer' : 'Shipping Address'}</div>
              {isFirearm ? (
                <>
                  <div className="ffl-info-banner"><Icon id="firearm-icon" size={20} /><div className="banner-text"><strong>⚠️ FFL Transfer Required</strong>Ship to a licensed FFL dealer.</div></div>
                  <div className="ffl-search-box"><input type="text" placeholder="Enter ZIP..." value={fflZip} onChange={event=>setFflZip(event.target.value)} /><button className="btn btn-primary btn-sm" disabled={fflSearching} onClick={searchFfl}>{fflSearching?'Searching…':'Search verified FFLs'}</button></div>
                  <div className="ffl-dealer-list">{fflDealers.map(d => (
                    <div key={d.id} className={`ffl-dealer-item ${form.selectedFFL?.id === d.id ? 'selected' : ''}`} onClick={() => update('selectedFFL', d)}>
                      <div className="dealer-icon"><Icon id="mappin-icon" size={24} /></div>
                      <div className="dealer-info"><div className="dealer-name">{d.name}</div><div className="dealer-addr">{d.addr}</div><div className="dealer-rating">FFL {d.license}</div></div>
                      <div style={{ textAlign: 'right' }}><div className="dealer-dist">{d.dist}</div><div className="dealer-radio" /></div>
                    </div>
                  ))}</div>
                </>
              ) : (
                <div className="address-grid">
                  <div className="form-group full-width"><label>Full Name</label><input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="John Doe" /></div>
                  <div className="form-group full-width"><label>Address</label><input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Main St" /></div>
                  <div className="form-group"><label>City</label><input type="text" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Stuttgart" /></div>
                  <div className="form-group"><label>State</label>
                    <select value={form.state} onChange={e => update('state', e.target.value)}>
                      <option value="">Select...</option>
                      {['AL','AK','AZ','AR','CA','CO','CT','FL','GA','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>ZIP</label><input type="text" value={form.zip} onChange={e => update('zip', e.target.value)} placeholder="72160" /></div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="checkout-section">
              <div className="section-title"><Icon id="payment-icon" size={20} /> Payment Method</div>
              <div className="provider-gate">
                <Icon id="lock-icon" size={32} />
                <h3>Protected checkout with GunTab</h3>
                <p>Payment, identity checks, and regulated-item transfer steps happen on GunTab. Hunter's Cache never collects your card number.</p>
                <span className={`status-badge ${providerStatus?.payment?.configured ? 'active' : 'cancelled'}`}>{providerStatus?.payment?.configured ? 'GunTab checkout ready' : 'Marketplace API key not configured'}</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-section">
              <div className="section-title"><Icon id="shipping-icon" size={20} /> Review Order</div>
              {isFirearm ? (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <div className="detail-item" style={{ marginBottom: 8 }}><div className="label">FFL Dealer</div><div className="value">{form.selectedFFL?.name}</div></div>
                  <div className="detail-item"><div className="label">Address</div><div className="value">{form.selectedFFL?.addr}</div></div>
                </div>
              ) : (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <div className="detail-item" style={{ marginBottom: 8 }}><div className="label">Shipping To</div><div className="value">{form.fullName}</div></div>
                  <div className="detail-item"><div className="label">Address</div><div className="value">{form.address}, {form.city}, {form.state} {form.zip}</div></div>
                </div>
              )}
              <div className="detail-item"><div className="label">Payment</div><div className="value">GunTab protected checkout</div></div>
              <div className="form-group" style={{ marginTop: 'var(--space-lg)', marginBottom: 0 }}>
                <label><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={form.agreed} onChange={e => update('agreed', e.target.checked)} style={{ width: 'auto' }} />
                  I agree to the <a href="#">Terms of Service</a>
                </span></label>
              </div>
            </div>
          )}

          <div className="checkout-actions">
            {checkoutError && <div className="auth-error">{checkoutError}</div>}
            <button className="btn btn-outline" onClick={() => step > 0 ? setStep(s => s - 1) : onBack()}>← {step === 0 ? 'Cancel' : 'Back'}</button>
            {step < 2 ? (
              <button className="btn btn-primary" disabled={step === 0 ? !shippingValid : !paymentValid}
                onClick={() => setStep(s => s + 1)}
                style={{ opacity: (step === 0 ? shippingValid : paymentValid) ? 1 : 0.5, cursor: (step === 0 ? shippingValid : paymentValid) ? 'pointer' : 'not-allowed' }}>Continue →</button>
            ) : (
              <button className="btn btn-primary btn-lg" disabled={!paymentValid || !form.agreed || submitting} onClick={placeOrder}
                style={{ opacity: (paymentValid && form.agreed) ? 1 : 0.5, cursor: (paymentValid && form.agreed) ? 'pointer' : 'not-allowed' }}>
                <Icon id="lock-icon" size={18} /> {paymentValid ? (submitting ? 'Creating GunTab checkout…' : `Continue — $${(item.price + 12.99).toFixed(2)}`) : 'Purchases are not available yet'}
              </button>
            )}
          </div>
        </div>

        <div className="checkout-sidebar">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="order-item-summary">
              <div className="thumb"><Icon id={mapCategoryIcon(item.game_category)} size={28} /></div>
              <div className="details"><div className="name">{item.title}</div><div className="meta">{item.game_category} · {item.region}</div><div className="price">${item.price}</div></div>
            </div>
            <div className="order-totals">
              <div className="order-total-row"><span>Item Price</span><span>${item.price}</span></div>
              <div className="order-total-row"><span>Shipping</span><span>$12.99</span></div>
              {isFirearm && <div className="order-total-row"><span>FFL transfer fee</span><span>Paid to dealer</span></div>}
              <div className="order-total-row total"><span>Total</span><span className="value">${(item.price + 12.99).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   SELLER DASHBOARD
   ============================================================ */
const SellerDashboard = ({ onNewListing, onNavigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState('listings')
  const [myListings, setMyListings] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [myOffers, setMyOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [gunTabEmail, setGunTabEmail] = useState(currentUser?.gunTabEmail || '')
  const [gunTabMessage, setGunTabMessage] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (getToken()) {
          const [listings, orders, offers] = await Promise.all([
            apiCall('/api/listings/mine').catch(() => []),
            apiCall('/api/orders/selling').catch(() => []),
            apiCall('/api/offers/selling').catch(() => []),
          ]);
          setMyListings(Array.isArray(listings) ? listings : []);
          setMyOrders(Array.isArray(orders) ? orders : []);
          setMyOffers(Array.isArray(offers) ? offers : []);
        } else {
          setMyListings([]);
          setMyOrders([]);
          setMyOffers([]);
        }
      } catch {
        setMyListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const respondToOffer = async (offerId, status) => {
    try {
      const updated = await apiCall(`/api/offers/${encodeURIComponent(offerId)}`, { method: 'PUT', body: JSON.stringify({ status }) })
      setMyOffers(current => current.map(offer => offer.id === offerId ? { ...offer, status: updated.status } : offer))
    } catch (error) { alert(error.message) }
  }

  const saveGunTabEmail = async () => {
    try {
      const profile = await apiCall('/api/auth/me', { method: 'PUT', body: JSON.stringify({ gunTabEmail }) })
      setGunTabEmail(profile.gunTabEmail || '')
      setGunTabMessage('Saved. This must match the verified email on your GunTab account.')
    } catch (error) { setGunTabMessage(error.message) }
  }

  const stats = {
    activeListings: myListings.filter(l => l.status !== 'sold' && l.status !== 'draft').length,
    totalViews: myListings.reduce((s, l) => s + (l.views || 0), 0),
    totalSales: myListings.filter(l => l.status === 'sold').length,
    revenue: myListings.filter(l => l.status === 'sold').reduce((s, l) => s + (Number(l.price) || 0), 0),
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); onNavigate('home') }}>
            <img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo" />
            <span className="navbar-title">Seller <span className="accent">Dashboard</span></span>
          </a>
          <div className="navbar-links">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home') }}>Browse</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('guide') }}>Hunting Guide</a>
            <a href="#" className="active">Seller Dashboard</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('profile') }}>My Profile</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('messages') }}>Messages</a>
          </div>
          <div className="navbar-actions">
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('home')}>← Browse</button>
            <button className="btn btn-primary btn-sm" onClick={onNewListing}>+ New Listing</button>
          </div>
        </div>
      </nav>

      <div className="seller-dashboard">
        {loading && <div className="loading-banner">Loading seller activity…</div>}
        <div className="dashboard-header">
          <div className="seller-avatar">
            <div className="avatar-circle">{(currentUser?.displayName || 'HC').split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'HC'}</div>
            <div>
              <div className="seller-name">{currentUser?.displayName || 'Seller Account'}</div>
              <div className="seller-status">{currentUser?.identityStatus === 'verified' ? '✓ Verified Identity' : 'Member Account'}</div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onNewListing}>+ Post New Listing</button>
        </div>

        <div className="dashboard-stats">
          {[
            { icon: 'orders-icon', color: '#2d5a27', value: stats.activeListings, label: 'Active Listings' },
            { icon: 'star-icon', color: '#5d4037', value: stats.totalViews, label: 'Total Views' },
            { icon: 'check-icon', color: '#c85a17', value: stats.totalSales, label: 'Total Sales' },
            { icon: 'payment-icon', color: '#6b8f5e', value: `${stats.revenue}`, label: 'Revenue' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}33` }}><Icon id={s.icon} size={22} /></div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="quick-actions">
          <button className="quick-action-btn" onClick={onNewListing}><Icon id="edit-icon" size={18} /> Post Listing</button>
          <button className="quick-action-btn"><Icon id="region-icon" size={18} /> Promote Listing</button>
          <button className="quick-action-btn"><Icon id="settings-icon" size={18} /> Store Settings</button>
        </div>

        <div className="section-card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="section-card-header"><h3>GunTab seller connection</h3><span className={`status-badge ${gunTabEmail ? 'active' : 'pending'}`}>{gunTabEmail ? 'Email saved' : 'Required before a sale'}</span></div>
          <div className="form-row" style={{ padding: 'var(--space-lg)' }}><div className="form-group" style={{ flex: 1, marginBottom: 0 }}><label>Verified GunTab email</label><input type="email" value={gunTabEmail} onChange={event => setGunTabEmail(event.target.value)} placeholder="seller@example.com"/><div className="hint">Create and verify your seller account at GunTab first. Hunter's Cache uses this email to create protected checkout invoices.</div></div><div style={{ alignSelf: 'end' }}><button className="btn btn-primary" onClick={saveGunTabEmail}>Save connection</button></div></div>
          {gunTabMessage && <div className="hint" style={{ padding: '0 var(--space-lg) var(--space-lg)' }}>{gunTabMessage}</div>}
        </div>

        <div className="tab-bar" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className={`tab-item ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
            <Icon id="orders-icon" size={16} /> My Listings
          </div>
          <div className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Icon id="shipping-icon" size={16} /> Orders ({myOrders.length})
          </div>
          <div className={`tab-item ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>
            <Icon id="payment-icon" size={16} /> Market Offers ({myOffers.filter(offer => offer.status === 'pending').length})
          </div>
        </div>

        {activeTab === 'listings' && (
          <div className="section-card">
            <div className="section-card-header">
              <h3>All Listings</h3>
              <button className="btn btn-primary btn-sm" onClick={onNewListing}>+ New</button>
            </div>
            <table className="listings-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Views</th>
                  <th>Sales</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myListings.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div className="listing-title-cell">
                        <div className="listing-thumb"><Icon id={mapCategoryIcon(l.category)} size={20} /></div>
                        <div><div className="title-text">{l.title}</div><span className="title-meta">{l.species} · {l.region}</span></div>
                      </div>
                    </td>
                    <td><span className={`status-badge ${l.status}`}>{l.status}</span></td>
                    <td>${l.price}</td>
                    <td>{l.views}</td>
                    <td>{l.sales}</td>
                    <td>
                      <div className="table-actions">
                        <button className="table-action-btn"><Icon id="edit-icon" size={16} /></button>
                        <button className="table-action-btn"><Icon id="star-icon" size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="section-card">
            <div className="section-card-header">
              <h3>Recent Orders</h3>
            </div>
            <table className="listings-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Buyer</th>
                  <th>Item</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>FFL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.length > 0 ? myOrders.map(o => (
                  <tr key={o.id}>
                    <td><span className="order-num" style={{ fontSize: 12 }}>{o.order_number || o.orderNum}<br /><span style={{ color: 'var(--color-smoke)', fontSize: 11 }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : o.date}</span></span></td>
                    <td><div style={{ fontSize: 13 }}>Buyer protected</div><div style={{ fontSize: 11, color: 'var(--color-smoke)' }}>Order #{o.order_number || o.orderNum}</div></td>
                    <td>{o.item_title || o.item}</td>
                    <td>${Number(o.total).toFixed(2)}</td>
                    <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                    <td style={{ fontSize: 12, color: (o.ffl_name || o.fflDealer) ? 'var(--color-highlight)' : 'var(--color-smoke)' }}>{(o.ffl_name || o.fflDealer) ? '✔️' : '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="table-action-btn"><Icon id="edit-icon" size={16} /></button>
                        <button className="table-action-btn"><Icon id="star-icon" size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-smoke)' }}>No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="section-card">
            <div className="section-card-header"><h3>Market-price offers</h3></div>
            {myOffers.length ? <div className="reviews-list">{myOffers.map(offer => (
              <article key={offer.id} className="review-card">
                <div className="offer-row"><div><span className="verified-purchase-label">Evidence-based offer</span><h3>${Number(offer.amount).toFixed(2)}</h3><small>Listing {offer.listing_id} · {offer.status}</small></div>
                  {offer.status === 'pending' && <div className="listing-actions"><button className="btn btn-primary btn-sm" onClick={() => respondToOffer(offer.id, 'accepted')}>Accept</button><button className="btn btn-outline btn-sm" onClick={() => respondToOffer(offer.id, 'declined')}>Decline</button></div>}
                </div>
              </article>
            ))}</div> : <div className="empty-state"><h3>No market-price offers</h3><p>Eligible offers will appear after a listing has enough comparable-sale evidence.</p></div>}
          </div>
        )}
      </div>
    </>
  )
}

/* ============================================================
   LISTING FORM
   ============================================================ */
const CATEGORIES_TAX = [
  { id:'waterfowl', name:'Waterfowl', species:['Duck','Goose','Swan'], icon:'waterfowl-icon' },
  { id:'big-game', name:'Big Game', species:['Whitetail Deer','Mule Deer','Elk','Moose','Bear','Pronghorn'], icon:'biggame-icon' },
  { id:'turkey', name:'Turkey', species:['Eastern',"Merriam's",'Rio Grande','Osceola'], icon:'turkey-icon' },
  { id:'upland-bird', name:'Upland Bird', species:['Pheasant','Quail','Grouse','Chukar','Dove'], icon:'fishing-icon' },
  { id:'small-game-varmint', name:'Varmint', species:['Coyote','Hog','Fox','Bobcat'], icon:'turkey-icon' },
  { id:'bowhunting', name:'Bowhunting', species:['Compound','Recurve','Crossbow','Arrows','Broadheads'], icon:'firearm-icon' },
  { id:'technical-apparel', name:'Apparel', species:['Base Layer','Mid Layer','Outer Jacket','Footwear'], icon:'apparel-icon' },
]
const MACRO_REGIONS = ['Northeast','Southeast','Midwest','West/Rockies','Southwest','Pacific NW','Alaska']
const FLYWAYS = ['Atlantic Flyway','Mississippi Flyway','Central Flyway','Pacific Flyway']
const TERRAIN_TAGS = ['Flooded Timber','High Desert','Alpine','Coastal Marsh','Deep Woods','Prairie','Swamp']
const CONDITIONS = [{label:'New',desc:'In box'},{label:'Like New',desc:'Used once'},{label:'Excellent',desc:'Light wear'},{label:'Good',desc:'Normal wear'},{label:'Fair',desc:'Significant wear'}]
const GUNTAB_TYPES = [
  ['other_non_regulated','Non-regulated gear or accessories'], ['ammunition_and_flammables','Ammunition, primers, or powder'],
  ['magazine','Magazine'], ['handgun','Modern handgun or frame'], ['long_gun','Modern rifle, shotgun, or receiver'],
  ['antique_gun','Antique gun'], ['curio_relic','Curio or relic'], ['suppressor','Suppressor'],
  ['short_barreled_long_gun','Short-barreled rifle or shotgun'], ['aow','AOW'], ['machine_gun','Machine gun'],
]
const STEPS = ['Category','Region','Condition','FFL & Details','Review']

const ListingForm = ({ onBack }) => {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({category:'',species:'',title:'',brand:'',region:'',flyway:'',terrain:[],condition:'',price:'',description:'',isFirearm:false,imageUrl:'',gunTabListingType:'other_non_regulated'})
  const update = (f,v) => setForm(p=>({...p,[f]:v}))
  const toggleTerrain = tag => setForm(f=>({...f, terrain: f.terrain.includes(tag) ? f.terrain.filter(t=>t!==tag) : [...f.terrain,tag]}))
  const canProceed = () => { switch(step) { case 0: return form.category&&form.species; case 1: return form.region; case 2: return form.condition&&form.price&&form.title&&form.description.length>=50; case 3: return !form.isFirearm||form.gunTabListingType!=='other_non_regulated'; default: return true } }

  return (
    <div className="listing-form-overlay">
      <div className="form-nav"><div className="form-nav-inner">
        <a href="#" className="navbar-brand" onClick={e=>{e.preventDefault();onBack()}}>
          <img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo" />
          <span className="navbar-title">Post a <span className="accent">Listing</span></span>
        </a>
        <div className="navbar-actions"><button className="btn btn-outline btn-sm" onClick={onBack}>Save Draft</button></div>
      </div></div>
      <div className="form-body">
        <div className="step-progress">{STEPS.map((s,i)=>(
          <span key={s} style={{display:'flex',alignItems:'center'}}>
            <div className="step-item"><div className={`step-circle ${i===step?'active':''} ${i<step?'completed':''}`}>{i<step?'✓':i+1}</div><span className={`step-label ${i===step?'active':''} ${i<step?'completed':''}`}>{s}</span></div>
            {i<STEPS.length-1&&<div className={`step-connector ${i<step?'completed':''}`}/>}
          </span>
        ))}</div>

        {step===0&&<div className="form-card"><h2>What are you selling?</h2><p className="form-subtitle">Select category</p>
          <div className="category-select-grid">{CATEGORIES_TAX.map(cat=>(
            <div key={cat.id} className={`category-option ${form.category===cat.id?'selected':''}`} onClick={()=>{update('category',cat.id);update('species','')}}>
              <Icon id={cat.icon} size={32}/><span className="cat-name">{cat.name}</span>
            </div>
          ))}</div>
          {form.category&&<div className="form-group"><label>Species</label><select value={form.species} onChange={e=>update('species',e.target.value)}>
            <option value="">Choose...</option>
            {CATEGORIES_TAX.find(c=>c.id===form.category)?.species.map(s=><option key={s} value={s}>{s}</option>)}
          </select></div>}
        </div>}

        {step===1&&<div className="form-card"><h2>Where does this belong?</h2><p className="form-subtitle">Tag region & terrain</p>
          <div className="form-row"><div className="form-group"><label>Region</label><select value={form.region} onChange={e=>update('region',e.target.value)}>
            <option value="">Select...</option>{MACRO_REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
          </select></div><div className="form-group"><label>Flyway</label><select value={form.flyway} onChange={e=>update('flyway',e.target.value)}>
            <option value="">N/A</option>{FLYWAYS.map(f=><option key={f} value={f}>{f}</option>)}
          </select></div></div>
          <div className="form-group"><label>Terrain</label><div className="tag-chips">{TERRAIN_TAGS.map(tag=>(
            <span key={tag} className={`tag-chip ${form.terrain.includes(tag)?'selected':''}`} onClick={()=>toggleTerrain(tag)}>{tag}</span>
          ))}</div></div>
        </div>}

        {step===2&&<div className="form-card"><h2>Price & Condition</h2>
          <div className="form-group"><label>Title</label><input type="text" value={form.title} onChange={e=>update('title',e.target.value)} placeholder="e.g. Benelli SBE 3"/></div>
          <div className="form-group"><label>Condition</label><div className="condition-options">{CONDITIONS.map(c=>(
            <div key={c.label} className={`condition-option ${form.condition===c.label?'selected':''}`} onClick={()=>update('condition',c.label)}>
              <span className="cond-label">{c.label}</span><span className="cond-desc">{c.desc}</span>
            </div>
          ))}</div></div>
          <div className="form-row"><div className="form-group"><label>Price</label><div className="price-input-wrapper"><span className="currency">$</span><input type="number" value={form.price} onChange={e=>update('price',e.target.value)} placeholder="0.00"/></div></div></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Condition, included accessories, size, model, and any flaws..."/><div className="hint">At least 50 characters so buyers and GunTab have enough detail.</div></div>
        </div>}

        {step===3&&<div className="form-card"><h2>Final Details</h2>
          <div className="form-group"><label>Main photo URL</label><input type="url" value={form.imageUrl} onChange={e=>update('imageUrl',e.target.value)} placeholder="https://..."/><div className="hint">Beta notice: Enter a public image URL (e.g. Unsplash, Imgur, or direct image link). Direct file uploads will be introduced with production object storage.</div></div>
          <div className="form-group"><label><span style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={form.isFirearm} onChange={e=>update('isFirearm',e.target.checked)} style={{width:'auto'}}/> Firearm (FFL required)</span></label></div>
          <div className="form-group"><label>GunTab merchandise type</label><select value={form.gunTabListingType} onChange={e=>update('gunTabListingType',e.target.value)}>{GUNTAB_TYPES.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div>
          {form.isFirearm&&<div className="ffl-section"><div className="ffl-title"><Icon id="firearm-icon" size={20}/> FFL Required</div><div className="ffl-note">Buyer selects a licensed dealer during checkout.</div></div>}
        </div>}

        {step===4&&<div className="form-card"><h2>Review</h2>
          <div className="review-card">
            <div className="review-row"><span className="review-label">Category</span><span className="review-value">{CATEGORIES_TAX.find(c=>c.id===form.category)?.name}</span></div>
            <div className="review-row"><span className="review-label">Title</span><span className="review-value">{form.title||'—'}</span></div>
            <div className="review-row"><span className="review-label">Price</span><span className="review-value" style={{color:'var(--color-highlight)'}}>${form.price||'—'}</span></div>
            <div className="review-row"><span className="review-label">Region</span><span className="review-value">{form.region}</span></div>
            <div className="review-row"><span className="review-label">Firearm</span><span className="review-value">{form.isFirearm?'Yes':'No'}</span></div>
            <div className="review-row"><span className="review-label">GunTab type</span><span className="review-value">{GUNTAB_TYPES.find(([id])=>id===form.gunTabListingType)?.[1]}</span></div>
          </div>
        </div>}

        <div className="form-actions">
          <div className="action-group">{step>0&&<button className="btn btn-outline" onClick={()=>setStep(s=>s-1)}>← Back</button>}</div>
          <div className="action-group">
            {step<4?<button className="btn btn-primary" onClick={()=>setStep(s=>s+1)} disabled={!canProceed()} style={{opacity:canProceed()?1:.5,cursor:canProceed()?'pointer':'not-allowed'}}>Continue →</button>
            :<button className="btn btn-primary btn-lg" disabled={!getToken()} onClick={async () => {
              try {
                await apiCall('/api/listings', {
                  method: 'POST',
                  body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    price: parseFloat(form.price),
                    game_category: form.category,
                    region: form.region,
                    condition: form.condition,
                    isFirearm: form.isFirearm,
                    imageUrl: form.imageUrl,
                    gunTabListingType: form.gunTabListingType,
                  }),
                });
                alert('Listing posted successfully!');
                onBack();
              } catch (err) {
                if (!getToken()) {
                  alert('Please sign in to post a listing');
                } else {
                  alert('Error: ' + err.message);
                }
              }
            }}><Icon id="check-icon" size={18}/> Post</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

const HUNTER_SAYINGS = [
  {
    saying: 'Wings cupped. Feet down.',
    resaleLine: 'Resell the spread. Fund next season.',
    badge: 'Waterfowl · Flooded Timber'
  },
  {
    saying: 'Wind in your face, cold in the air.',
    resaleLine: 'Sell what you outgrew. Buy what fits.',
    badge: 'Big Game · Midwest Rut'
  },
  {
    saying: 'Bugling in the dark timber.',
    resaleLine: 'Turn unused gear into tag money.',
    badge: 'Elk · Rocky Mountain Divide'
  },
  {
    saying: 'Heavy packs, earned miles.',
    resaleLine: 'Pass down gear with seasons left.',
    badge: 'Backcountry · Western Ridges'
  },
  {
    saying: "Hammerin' on the roost at first light.",
    resaleLine: 'Trade pre-owned gear hunter-to-hunter.',
    badge: 'Turkey · Spring Woods'
  },
  {
    saying: 'Lock ’em up. Take ’em.',
    resaleLine: 'The dedicated hunting gear resale market.',
    badge: 'Waterfowl · Mississippi Flyway'
  },
]

/* ============================================================
   HOMEPAGE VIEW
   ============================================================ */
const HomeView = ({ items, categories, onViewItem, onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState(null)
  const [sayingIdx, setSayingIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setSayingIdx(prev => (prev + 1) % HUNTER_SAYINGS.length)
        setFade(true)
      }, 220)
    }, 3800)
    return () => clearInterval(timer)
  }, [])

  const safeCategories = Array.isArray(categories) ? categories : []
  const safeItems = Array.isArray(items) ? items : []
  const filteredItems = activeCategory ? safeItems.filter(i => i.game_category === activeCategory) : safeItems
  const currentSaying = HUNTER_SAYINGS[sayingIdx]

  return (
    <>
      <section className="hero-section">
        <div className="hero-background"><img src="/assets/hero-banner.png" alt="Forest" /></div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-saying-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            background: 'rgba(200, 90, 23, 0.18)',
            border: '1px solid rgba(200, 90, 23, 0.45)',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--color-cream)',
            marginBottom: 'var(--space-lg)',
            backdropFilter: 'blur(4px)'
          }}>
            <span style={{ color: 'var(--color-burnt-orange)' }}>●</span>
            <span style={{ color: 'var(--color-tan)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>
              Hunter-to-Hunter Resale • {currentSaying.badge}
            </span>
          </div>
          <h1 style={{
            minHeight: '2.5em',
            transition: 'opacity 0.22s ease-in-out',
            opacity: fade ? 1 : 0
          }}>
            “{currentSaying.saying}”<br />
            <span className="text-accent">{currentSaying.resaleLine}</span>
          </h1>
          <p>
            Hunter's Cache is the nationwide resale marketplace built exclusively for hunters. Resell the decoys, optics, saddles, packs, and gear sitting in your garage — or score field-proven gear at true secondhand prices.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('sell')}>+ Start Reselling Gear</button>
            <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}>Browse Resale Gear</button>
          </div>
          <div className="hero-proof">Free to list <span>•</span> First sale fee waived <span>•</span> 5% after that, capped at $250 <span>•</span> Zero retail markup</div>
        </div>
      </section>
      <div className="category-bar"><div className="category-bar-inner">
        {safeCategories.map(cat => (
          <div key={cat.id} className={`category-chip ${activeCategory===cat.id?'active':''}`} onClick={()=>setActiveCategory(activeCategory===cat.id?null:cat.id)}>
            <Icon id={mapCategoryIcon(cat.id)} size={18}/><span>{cat.name}</span>
          </div>
        ))}
      </div></div>
      <section className="value-strip" aria-label="How Hunter's Cache resale works">
        <div><strong>1. Clear out your cache</strong><span>List extra decoys, stands, packs, and optics for free in 60 seconds.</span></div>
        <div><strong>2. Hunter-to-hunter resale</strong><span>Buyers discover pre-owned gear tagged by exact game, season, and terrain.</span></div>
        <div><strong>3. Fund your next tag</strong><span>Protected checkout on gear, with licensed FFL transfer on all regulated firearms.</span></div>
      </section>
      <div className="section-header" id="marketplace"><h2>{activeCategory?safeCategories.find(c=>c.id===activeCategory)?.name:'Featured Resale Listings'}</h2><span className="section-context">{filteredItems.length} items</span></div>
      <div className="marketplace-grid">
        {filteredItems.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-2xl) var(--space-md)', textAlign: 'center', gridColumn: '1 / -1' }}>
            <h3>No resale listings yet{activeCategory ? ` in ${safeCategories.find(c => c.id === activeCategory)?.name}` : ''}</h3>
            <p>Be the first to list pre-owned gear in this category for the nationwide hunting resale beta.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('sell')}>+ Post a Resale Listing</button>
          </div>
        ) : filteredItems.map(item => (
          <div key={item.id} className="item-card" onClick={() => onViewItem(item)}>
            <div className="item-card-image">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="icon-wrapper"><Icon id={item.is_firearm ? 'firearm-icon' : mapCategoryIcon(item.game_category)} size={36} /></div>
              )}
              <span className="item-card-badge featured">{item.is_firearm ? 'FFL Required' : (item.condition || 'Available')}</span>
            </div>
            <div className="item-card-body">
              <h3>{item.title}</h3>
              <div className="item-card-category">{item.game_category}</div>
              <div className="item-card-meta">
                <div className="item-card-location"><Icon id="region-icon" size={12} /><span>{item.region}</span></div>
                <span className="divider" />
                <span>{item.condition || 'Pre-owned'}</span>
              </div>
              <div className="item-card-footer">
                <div className="item-card-price">${item.price}</div>
                {item.seller_rating ? <Stars rating={item.seller_rating} /> : <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.seller_name || 'Seller'}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ============================================================
   LISTING DETAIL VIEW
   ============================================================ */
const DetailView = ({ item, onBack, onNavigate, currentUser, onRequireAuth }) => {
  const [marketPrice, setMarketPrice] = useState(null)
  const [offerStatus, setOfferStatus] = useState('')
  useEffect(() => {
    let cancelled = false
    if (item?.id && item.seller_id) {
      apiCall(`/api/listings/${encodeURIComponent(item.id)}/market-price`)
        .then(data => { if (!cancelled) setMarketPrice(data) })
        .catch(() => { if (!cancelled) setMarketPrice(null) })
    }
    return () => { cancelled = true }
  }, [item])
  if (!item) return null
  const offerMarketPrice = async () => {
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth('signup')
      else onNavigate('profile')
      return
    }
    if (!marketPrice?.available) return
    setOfferStatus('Sending…')
    try {
      await apiCall(`/api/listings/${encodeURIComponent(item.id)}/offers`, { method: 'POST', body: JSON.stringify({ amount: marketPrice.estimate }) })
      setOfferStatus(`Market-price offer of $${marketPrice.estimate.toFixed(2)} sent`)
    } catch (error) { setOfferStatus(error.message) }
  }
  const contactSeller = async () => {
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth('signup')
      else onNavigate('profile')
      return
    }
    try { const conversation = await apiCall('/api/conversations', { method: 'POST', body: JSON.stringify({ listingId: item.id }) }); onNavigate('messages', conversation) }
    catch (error) { setOfferStatus(error.message) }
  }
  const reportListing = async () => {
    const reason = window.prompt('Why are you reporting this listing?')
    if (!reason) return
    try { await apiCall('/api/reports', { method: 'POST', body: JSON.stringify({ targetType: 'listing', targetId: item.id, reason }) }); setOfferStatus('Report received. The listing will be reviewed.') }
    catch (error) { setOfferStatus(error.message) }
  }
  return (
    <>
      <nav className="navbar"><div className="navbar-inner">
        <a href="#" className="navbar-brand" onClick={onBack}>
          <img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo" />
          <span className="navbar-title">Hunter's <span className="accent">Cache</span></span>
        </a>
        <div className="navbar-actions">
          <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
          <button className="btn btn-primary btn-sm" onClick={()=>onNavigate('sell')}>Sell Yours</button>
        </div>
      </div></nav>
      <div className="listing-detail">
        <div className="listing-gallery"><Icon id={item.is_firearm?'firearm-icon':mapCategoryIcon(item.game_category)} size={80}/></div>
        <div className="listing-info">
          <span className="item-card-category" style={{marginBottom:8,display:'block'}}>{item.game_category}</span>
          <h1>{item.title}</h1>
          <div className="listing-price-large">${item.price}</div>
          <div className="item-card-meta" style={{marginBottom:16}}>
            <div className="item-card-location"><Icon id="region-icon" size={14}/><span>{item.region}</span></div>
            <span className="divider"/><span>{item.condition || 'Pre-owned'}</span>
            {item.seller_rating && <><span className="divider"/><Stars rating={item.seller_rating}/></>}
          </div>
          <p className="listing-description">{item.description||`Excellent condition ${item.title}.`}</p>
          <button className="seller-link-card" onClick={() => onNavigate('seller', { id: item.seller_id || 'demo', listing: item })}>
            <span className="seller-link-avatar">{(item.seller_name || 'Seller').slice(0, 2).toUpperCase()}</span>
            <span><strong>{item.seller_name || 'View seller profile'}</strong><small>Listings, completed sales, and buyer feedback →</small></span>
          </button>
          <div className="listing-details-grid">
            <div className="detail-item"><div className="label">Condition</div><div className="value">{item.condition || 'Pre-owned'}</div></div>
            <div className="detail-item"><div className="label">Region</div><div className="value">{item.region}</div></div>
            <div className="detail-item"><div className="label">Category</div><div className="value">{item.game_category}</div></div>
            <div className="detail-item"><div className="label">FFL</div><div className="value">{item.is_firearm?'Yes':'No'}</div></div>
          </div>
          <div className="market-price-card">
            <div><span className="verified-purchase-label">Hunter's Cache Market Estimate</span>
              <strong>{marketPrice?.available ? `$${marketPrice.estimate.toFixed(2)}` : 'Not enough verified sales yet'}</strong>
              <small>{marketPrice?.available ? `${marketPrice.sampleSize} comparable completed sales · ${marketPrice.confidence} confidence` : `Requires at least ${marketPrice?.minimumSample || 3} attributable completed-sale comparables.`}</small>
            </div>
            <p>{marketPrice?.methodology || 'The estimate uses completed-sale evidence, not active asking prices or an unexplained AI guess.'}</p>
            {marketPrice?.sources?.length > 0 && <details className="market-sources"><summary>View comparable-sale evidence</summary>
              {marketPrice.sources.map((source, index) => <div key={`${source.source_id || source.order_number}-${index}`} className="market-source-row">
                <span>{source.item_title} · {source.item_condition || 'Condition not recorded'}{source.accessories ? ` · ${source.accessories}` : ''}</span>
                <strong>${Number(source.item_price).toFixed(2)}</strong>
                {source.source_url ? <a href={source.source_url} target="_blank" rel="noreferrer">{source.source_name}</a> : <span>Hunter's Cache verified sale</span>}
                <small>{source.completed_at ? new Date(source.completed_at).toLocaleDateString() : ''}</small>
              </div>)}
            </details>}
          </div>
          <div className="profile-notice" style={{ marginBottom: 'var(--space-md)' }}>
            <strong>Beta notice:</strong> Purchases are not available yet while payment verification is pending. Please contact the seller below to inquire or discuss this listing.
          </div>
          <div className="listing-actions">
            <button className="btn btn-primary btn-lg" onClick={contactSeller}>
              Message Seller
            </button>
            <button className="btn btn-outline btn-lg" disabled title="Purchases are not available yet" style={{ opacity: 0.65, cursor: 'not-allowed' }}>
              Purchases not available yet
            </button>
          </div>
          <div className="listing-actions">
            <button className="btn btn-secondary" disabled={!marketPrice?.available} onClick={offerMarketPrice}>
              {marketPrice?.available ? `Offer Market Price — $${marketPrice.estimate.toFixed(2)}` : 'Market Offer Unavailable'}
            </button>
            <button className="btn btn-outline" onClick={reportListing}>Report listing</button>
          </div>
          {offerStatus && <div className="profile-notice">{offerStatus}</div>}
        </div>
      </div>
    </>
  )
}

const MessagingView = ({ initialConversation, onNavigate }) => {
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(initialConversation || null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => { apiCall('/api/conversations').then(rows => { setConversations(rows); setActive(current => current || rows[0] || null) }).catch(error => setNotice(error.message)) }, [])
  useEffect(() => { if (active?.id) apiCall(`/api/conversations/${active.id}/messages`).then(setMessages).catch(error => setNotice(error.message)) }, [active])
  const send = async () => {
    if (!draft.trim() || !active) return
    try { const message = await apiCall(`/api/conversations/${active.id}/messages`, { method: 'POST', body: JSON.stringify({ body: draft }) }); setMessages(rows => [...rows, message]); setDraft('') }
    catch (error) { setNotice(error.message) }
  }
  return <><nav className="navbar"><div className="navbar-inner"><a href="#" className="navbar-brand" onClick={event=>{event.preventDefault();onNavigate('home')}}><img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo"/><span className="navbar-title">Hunter's <span className="accent">Cache</span></span></a><button className="btn btn-outline btn-sm" onClick={()=>onNavigate('home')}>← Browse</button></div></nav>
    <div className="profile-page"><h1>Messages</h1><p className="form-subtitle">Keep transaction conversations here so both parties and support have a clear record.</p>{notice&&<div className="profile-notice">{notice}</div>}
      <div style={{display:'grid',gridTemplateColumns:'minmax(220px, 1fr) 2fr',gap:20}}><div className="section-card">{conversations.length ? conversations.map(row=><button key={row.id} className={`quick-action-btn ${active?.id===row.id?'active':''}`} style={{width:'100%',marginBottom:8}} onClick={()=>setActive(row)}><span><strong>{row.listing_title||'Order conversation'}</strong><small style={{display:'block'}}>{row.last_message||'No messages yet'}</small></span></button>) : <div className="empty-state"><p>No conversations yet.</p></div>}</div>
        <div className="section-card" style={{padding:20}}>{active ? <><div style={{minHeight:320}}>{messages.map(message=><div key={message.id} className="review-card"><strong>{message.sender_name||'You'}</strong><p>{message.body}</p><small>{new Date(message.created_at||message.createdAt).toLocaleString()}</small></div>)}</div><div className="form-row"><div className="form-group" style={{flex:1,margin:0}}><textarea value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Write a message…"/></div><button className="btn btn-primary" onClick={send}>Send</button></div></> : <div className="empty-state"><p>Select a conversation.</p></div>}</div></div>
    </div></>
}

/* ============================================================
   PUBLIC SELLER PROFILE
   ============================================================ */
const PublicSellerProfile = ({ sellerRef, onNavigate, onViewItem }) => {
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadSeller = async () => {
      try {
        if (sellerRef?.id && sellerRef.id !== 'demo') {
          const data = await apiCall(`/api/sellers/${encodeURIComponent(sellerRef.id)}`)
          if (!cancelled) setSeller(data)
        } else if (!cancelled) {
          setSeller({
            id: 'demo', displayName: 'Seller profile preview', location: sellerRef?.listing?.region || '',
            bio: 'Public seller information will appear here after the seller completes their profile.',
            memberSince: null, completedSales: 0, rating: null, ratingCount: 0, reviews: [],
            listings: sellerRef?.listing ? [sellerRef.listing] : [], isDemo: true,
          })
        }
      } catch {
        if (!cancelled) setSeller(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadSeller()
    return () => { cancelled = true }
  }, [sellerRef])

  if (loading) return <div className="profile-page"><div className="empty-state"><h3>Loading seller profile…</h3></div></div>

  if (!seller) return (
    <div className="profile-page"><div className="empty-state"><h3>Seller profile unavailable</h3><button className="btn btn-primary" onClick={() => onNavigate('home')}>Back to Browse</button></div></div>
  )

  const initials = seller.displayName?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'HC'
  const activeListings = Array.isArray(seller.listings) ? seller.listings : []
  const reviews = Array.isArray(seller.reviews) ? seller.reviews : []

  return (
    <>
      <nav className="navbar"><div className="navbar-inner">
        <a href="#" className="navbar-brand" onClick={e => { e.preventDefault(); onNavigate('home') }}>
          <img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo" />
          <span className="navbar-title">Hunter's <span className="accent">Cache</span></span>
        </a>
        <button className="btn btn-outline btn-sm" onClick={() => onNavigate('home')}>← Browse</button>
      </div></nav>
      <main className="public-seller-page">
        {seller.isDemo && <div className="profile-notice">Preview profile — no seller performance claims are available for this demonstration listing.</div>}
        <section className="public-seller-header">
          <div className="profile-avatar-large">{initials}</div>
          <div className="public-seller-identity">
            <span className="verified-purchase-label">Public seller profile</span>
            <h1>{seller.displayName}</h1>
            <p>{[seller.location, seller.memberSince ? `Member since ${new Date(seller.memberSince).getFullYear()}` : null].filter(Boolean).join(' · ') || 'Location not provided'}</p>
            {seller.bio && <div className="seller-bio">{seller.bio}</div>}
          </div>
        </section>

        <section className="seller-trust-grid" aria-label="Seller trust summary">
          <div><strong>{seller.rating ? Number(seller.rating).toFixed(1) : 'New'}</strong><span>Buyer rating</span></div>
          <div><strong>{seller.ratingCount || 0}</strong><span>Verified reviews</span></div>
          <div><strong>{seller.completedSales || 0}</strong><span>Completed sales</span></div>
          <div><strong>{activeListings.length}</strong><span>Active listings</span></div>
        </section>

        <section className="seller-public-section">
          <div className="section-header"><h2>Listings</h2><span className="section-context">{activeListings.length} active</span></div>
          {activeListings.length ? <div className="marketplace-grid seller-listings-grid">{activeListings.map(item => (
            <button key={item.id} className="item-card seller-listing-button" onClick={() => onViewItem(item)}>
              <div className="item-card-image"><div className="icon-wrapper"><Icon id={item.is_firearm ? 'firearm-icon' : mapCategoryIcon(item.game_category)} size={36}/></div></div>
              <div className="item-card-body"><h3>{item.title}</h3><div className="item-card-price">${item.price}</div></div>
            </button>
          ))}</div> : <div className="empty-state"><h3>No active listings</h3><p>This seller does not currently have gear listed.</p></div>}
        </section>

        <section className="seller-public-section">
          <div className="section-header"><h2>Buyer feedback</h2><span className="section-context">Verified purchases only</span></div>
          {reviews.length ? <div className="reviews-list">{reviews.map(review => (
            <article key={review.id} className="review-card"><Stars rating={review.rating}/><p>{review.comment}</p><small>{review.buyerDisplayName} · Verified buyer · {review.createdAt}</small></article>
          ))}</div> : <div className="empty-state"><h3>No buyer feedback yet</h3><p>Only buyers with a completed Hunter's Cache order can review this seller.</p></div>}
        </section>
      </main>
    </>
  )
}

/* ============================================================
   AUTH MODAL (Sign In / Sign Up)
   ============================================================ */
const AuthModal = ({ mode, onClose, onAuth }) => {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { email, password } : { email, password, displayName, location: location || undefined };
      const data = await apiCall(endpoint, { method: 'POST', body: JSON.stringify(body) });
      setToken(data.token);
      setUser(data.user);
      onAuth(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{isLogin ? 'Welcome Back' : 'Join Hunter\'s Cache'}</h2>
        <p className="form-subtitle">{isLogin ? 'Sign in to your account' : 'Create your free account'}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="John Doe" required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hunter@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label>Region (optional)</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Stuttgart, AR" />
            </div>
          )}
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-md)' }} disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setError(''); }}>{isLogin ? 'Sign Up' : 'Sign In'}</a>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   APP ROOT
   ============================================================ */
function App() {
  const [currentView, setCurrentView] = useState('home')
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(getUser)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  useEffect(() => {
    let cancelled = false

    // Verify stored auth token
    const verifyAuth = async () => {
      if (getToken()) {
        try {
          const user = await apiCall('/api/auth/me');
          if (!cancelled) { setCurrentUser(user); setUser(user); }
        } catch {
          setToken(null); setUser(null); setCurrentUser(null);
        }
      }
    };
    verifyAuth();

    const fetchData = async () => {
      try {
        const [listingsRes, catsRes] = await Promise.all([
          fetch(`${API_BASE}/api/listings`),
          fetch(`${API_BASE}/api/categories`)
        ])

        if (cancelled) return

        // Always ensure categories is an array
        if (listingsRes.ok) {
          const data = await listingsRes.json()
          if (!cancelled && Array.isArray(data)) setItems(data)
          else if (!cancelled) setItems(import.meta.env.DEV ? MOCK_LISTINGS : [])
        } else {
          if (!cancelled) setItems(import.meta.env.DEV ? MOCK_LISTINGS : [])
        }

        if (catsRes.ok) {
          const data = await catsRes.json()
          if (!cancelled && Array.isArray(data)) setCategories(data)
          else if (!cancelled) setCategories(import.meta.env.DEV ? MOCK_CATEGORIES : [])
        } else {
          if (!cancelled) setCategories(import.meta.env.DEV ? MOCK_CATEGORIES : [])
        }
      } catch (err) {
        console.error('API fetch error, using Demo Mode:', err)
        if (!cancelled) {
          setItems(import.meta.env.DEV ? MOCK_LISTINGS : [])
          setCategories(import.meta.env.DEV ? MOCK_CATEGORIES : [])
        }
      }
      finally { if (!cancelled) setLoading(false) }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const navigate = (view, item) => {
    const protectedViews = ['sell', 'new-listing', 'profile', 'messages']
    if (protectedViews.includes(view) && !currentUser) {
      setAuthMode('signup')
      setShowAuth(true)
      return
    }
    if (view === 'checkout') { setSelectedItem(item || selectedItem); setCurrentView('checkout') }
    else if (view === 'detail') { setSelectedItem(item); setCurrentView('detail') }
    else if (view === 'guide') { setCurrentView('guide') }
    else if (view === 'profile') { setCurrentView('profile') }
    else if (view === 'sell') { setCurrentView('sell') }
    else if (view === 'new-listing') { setCurrentView('new-listing') }
    else if (view === 'seller') { setSelectedSeller(item); setCurrentView('seller') }
    else if (view === 'messages') { setSelectedConversation(item || null); setCurrentView('messages') }
    else { setCurrentView(view) }
  }

  const handleViewItem = (item) => { setSelectedItem(item); setCurrentView('detail') }
  const handleBack = (e) => { if (e) e.preventDefault(); setCurrentView('home') }

  if (loading) {
    return <div style={{backgroundColor:'#0f1f0f',color:'#f5f5dc',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:'2rem',fontWeight:'bold',marginBottom:'1rem'}}>Hunter's Cache</div><div>Scouting gear...</div></div>
    </div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {currentView === 'home' && (
        <nav className="navbar"><div className="navbar-inner">
          <a href="#" className="navbar-brand" onClick={e=>e.preventDefault()}>
            <img src="/assets/logo-icon.png" alt="Hunter's Cache" className="navbar-logo" />
            <span className="navbar-title">Hunter's <span className="accent">Cache</span></span>
          </a>
          <div className="navbar-links">
            <a href="#" className="active">Browse</a>
            <a href="#" onClick={e=>{e.preventDefault();navigate('guide')}}>Hunting Guide</a>
            {currentUser && (
              <>
                <a href="#" onClick={e=>{e.preventDefault();navigate('sell')}}>Seller Dashboard</a>
                <a href="#" onClick={e=>{e.preventDefault();navigate('profile')}}>My Profile</a>
                <a href="#" onClick={e=>{e.preventDefault();navigate('messages')}}>Messages</a>
              </>
            )}
          </div>
          <div className="navbar-actions">
            {currentUser ? (
              <>
                <span className="navbar-user">{currentUser.displayName}</span>
                <button className="btn btn-outline btn-sm" onClick={() => { setToken(null); setUser(null); setCurrentUser(null); }}>Sign Out</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => { setAuthMode('login'); setShowAuth(true); }}>Sign In</button>
                <button className="btn btn-primary btn-sm" onClick={() => { setAuthMode('signup'); setShowAuth(true); }}>Join Free</button>
              </>
            )}
          </div>
        </div></nav>
      )}

      {currentView === 'home' && <HomeView items={items} categories={categories} onViewItem={handleViewItem} onNavigate={navigate} />}
      {currentView === 'detail' && <DetailView item={selectedItem} onBack={handleBack} onNavigate={navigate} currentUser={currentUser} onRequireAuth={(mode) => { setAuthMode(mode || 'signup'); setShowAuth(true); }} />}
      {currentView === 'seller' && <PublicSellerProfile sellerRef={selectedSeller} onNavigate={navigate} onViewItem={handleViewItem} />}
      {currentView === 'sell' && <SellerDashboard onNewListing={()=>navigate('new-listing')} onNavigate={navigate} currentUser={currentUser} />}
      {currentView === 'new-listing' && <ListingForm onBack={()=>navigate('sell')} />}
      {currentView === 'checkout' && <CheckoutView item={selectedItem} onBack={handleBack} onNavigate={navigate} />}
      {currentView === 'profile' && <BuyerProfileView onNavigate={navigate} currentUser={currentUser} />}
      {currentView === 'guide' && <RegionalGuideView onNavigate={navigate} items={items} currentUser={currentUser} />}
      {currentView === 'messages' && <MessagingView initialConversation={selectedConversation} onNavigate={navigate} />}

      {showAuth && <AuthModal mode={authMode} onClose={() => setShowAuth(false)} onAuth={(user) => setCurrentUser(user)} />}
    </div>
  )
}

export default App
