import React, { useState } from 'react'

export default function SettingsPage() {
  const [weights, setWeights] = useState({
    history: 30,
    rainfall: 20,
    plastic: 20,
    slope: 10,
    material: 10,
    cleaning: 10
  })

  const [savedMsg, setSavedMsg] = useState(false)

  const handleWeightChange = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: parseInt(val) || 0 }))
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  const handleSave = (e) => {
    e.preventDefault()
    if (totalWeight !== 100) {
      alert(`Weights must sum to exactly 100%. Current total: ${totalWeight}%`)
      return
    }
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 3000)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ System Configuration & Formula Tuning</h1>
          <p className="page-subtitle">
            Configure risk algorithm weights, GIS map defaults, and municipal system parameters
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="alert alert-success mb-4">
          ✅ Risk weight parameters saved successfully. Formula recalculated for all channels.
        </div>
      )}

      {/* Risk Scoring Weight Tuning */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3>🧮 Multi-Factor Risk Algorithm Weight Tuning</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Adjust component weights for computing the blockage risk index (Sum must equal 100%)
            </p>
          </div>
          <span className={`badge ${totalWeight === 100 ? 'badge-success' : 'badge-danger'}`}>
            Total Weight: {totalWeight}%
          </span>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px', backgroundColor: '#0f172a' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                <span>Historical Incidents Weight</span>
                <span className="text-accent">{weights.history}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.history}
                onChange={(e) => handleWeightChange('history', e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Weight of repeated past clog observations
              </div>
            </div>

            <div className="card" style={{ padding: '16px', backgroundColor: '#0f172a' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                <span>Rainfall Vulnerability Weight</span>
                <span className="text-info">{weights.rainfall}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.rainfall}
                onChange={(e) => handleWeightChange('rainfall', e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Sensitivity to monsoon rainfall surges
              </div>
            </div>

            <div className="card" style={{ padding: '16px', backgroundColor: '#0f172a' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                <span>Plastic Density & Proximity</span>
                <span className="text-warning">{weights.plastic}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.plastic}
                onChange={(e) => handleWeightChange('plastic', e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Proximity to market waste outfalls
              </div>
            </div>

            <div className="card" style={{ padding: '16px', backgroundColor: '#0f172a' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                <span>Slope & Capacity Weight</span>
                <span className="text-success">{weights.slope}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.slope}
                onChange={(e) => handleWeightChange('slope', e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Channel gradient flow velocity factor
              </div>
            </div>

            <div className="card" style={{ padding: '16px', backgroundColor: '#0f172a' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                <span>Drain Material Factor</span>
                <span style={{ color: '#8b5cf6' }}>{weights.material}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.material}
                onChange={(e) => handleWeightChange('material', e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Concrete box vs earthen channel friction
              </div>
            </div>

            <div className="card" style={{ padding: '16px', backgroundColor: '#0f172a' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                <span>Cleaning Recency Weight</span>
                <span style={{ color: '#ec4899' }}>{weights.cleaning}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.cleaning}
                onChange={(e) => handleWeightChange('cleaning', e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Days elapsed since last desilting
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={totalWeight !== 100}>
              💾 Save Algorithm Weights
            </button>
          </div>
        </form>
      </div>

      {/* GIS Location Defaults */}
      <div className="card">
        <h3>📍 Study Area GIS Location Defaults</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Geographic center coordinates for Madurai Municipal Study Area
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label className="form-label">Center Latitude</label>
            <input type="text" className="form-control" value="9.9252" readOnly />
          </div>
          <div>
            <label className="form-label">Center Longitude</label>
            <input type="text" className="form-control" value="78.1198" readOnly />
          </div>
          <div>
            <label className="form-label">Default Zoom Level</label>
            <input type="text" className="form-control" value="13" readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
