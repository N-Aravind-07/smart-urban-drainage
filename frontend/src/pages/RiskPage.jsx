import React, { useState, useEffect } from 'react'
import { riskAPI } from '../api/client'

export default function RiskPage() {
  const [riskItems, setRiskItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [tierFilter, setTierFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchRiskScores()
  }, [])

  const fetchRiskScores = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await riskAPI.getAll()
      setRiskItems(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to compute risk scores.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = riskItems.filter(item => {
    const rLevel = item.risk_level || item.risk_category || 'MEDIUM'
    if (tierFilter !== 'ALL' && rLevel !== tierFilter) return false
    if (search) {
      const term = search.toLowerCase()
      const matchCode = item.drain_id?.toLowerCase().includes(term)
      if (!matchCode) return false
    }
    return true
  })

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div className="page-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">⚠️ Multi-Factor Blockage Risk Scoring</h1>
          <p className="page-subtitle">
            Transparent weighted formula combining hydrology, plastic density, history & slope metrics
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchRiskScores}>🔄 Re-compute Formula</button>
      </div>

      {/* Formula Explainer Banner */}
      <div className="card mb-4" style={{ borderLeft: '4px solid var(--accent-warning)', padding: '16px' }}>
        <h4 style={{ marginBottom: '8px', color: 'var(--accent-warning)' }}>
          🧮 Multi-Factor Risk Assessment Index Formula
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', fontSize: '12px' }}>
          <div>• <strong>Historical Incidents:</strong> 30%</div>
          <div>• <strong>Rainfall Sensitivity:</strong> 20%</div>
          <div>• <strong>Plastic Density:</strong> 20%</div>
          <div>• <strong>Channel Condition:</strong> 10%</div>
          <div>• <strong>Land Use / Market Activity:</strong> 10%</div>
          <div>• <strong>Cleaning Recency:</strong> 10%</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="stat-card" style={{ backgroundColor: '#1c2333', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div className="stat-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HIGH RISK CHANNELS</div>
          <div className="stat-value text-danger" style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {riskItems.filter(i => (i.risk_level || i.risk_category) === 'HIGH').length}
          </div>
          <div className="stat-desc" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Immediate desilting priority</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#1c2333', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div className="stat-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MEDIUM RISK CHANNELS</div>
          <div className="stat-value text-warning" style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {riskItems.filter(i => (i.risk_level || i.risk_category) === 'MEDIUM').length}
          </div>
          <div className="stat-desc" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scheduled maintenance target</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#1c2333', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div className="stat-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LOW RISK CHANNELS</div>
          <div className="stat-value text-success" style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {riskItems.filter(i => (i.risk_level || i.risk_category) === 'LOW').length}
          </div>
          <div className="stat-desc" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Normal operating state</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#1c2333', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div className="stat-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MAX RISK SCORE</div>
          <div className="stat-value text-accent" style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {riskItems.length > 0 ? `${Math.round(Math.max(...riskItems.map(i => i.total_score || i.risk_score || 0)))}/100` : '0/100'}
          </div>
          <div className="stat-desc" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Peak vulnerability index</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Search Drain Code
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Search drain code (e.g. MDU-OSM-28698752)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Risk Tier
            </label>
            <select
              className="form-control"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Calculated Risk Index ({filtered.length} Drains)</h3>
          <span className="badge badge-info">WEIGHTED MULTI-FACTOR MODEL</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Evaluating 6-factor risk matrix across network...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Drain Channel ID</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Primary Contributing Factors</th>
                  <th>Action Needed</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const score = Math.round(item.total_score || item.risk_score || 0)
                  const level = item.risk_level || item.risk_category || 'MEDIUM'
                  return (
                    <tr key={item.drain_id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                        {item.drain_id}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontWeight: 'bold',
                            fontSize: '15px',
                            color: score >= 70 ? 'var(--accent-danger)' :
                                   score >= 45 ? 'var(--accent-warning)' : 'var(--accent-success)'
                          }}>
                            {score}
                          </span>
                          <div style={{ flex: 1, height: '8px', backgroundColor: '#334155', borderRadius: '4px', width: '70px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${score}%`,
                              backgroundColor: score >= 70 ? '#ef4444' :
                                               score >= 45 ? '#f59e0b' : '#10b981'
                            }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          level === 'HIGH' ? 'badge-danger' :
                          level === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {level}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(item.reasons || ['High plastic load', 'Market area']).map((r, idx) => (
                            <span key={idx} className="badge badge-info" style={{ fontSize: '10px' }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {score >= 70 ? '🔥 High Priority Trash Trap' :
                         score >= 45 ? '🔧 Desilting & Screen Check' : '✅ Routine Monitoring'}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={() => setSelectedItem(item)}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Risk Breakdown: {selectedItem.drain_id}</h3>
              <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>✕</button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Overall Risk Score:</strong> <span className="text-danger" style={{ fontSize: '18px', fontWeight: 'bold' }}>{Math.round(selectedItem.total_score || 0)} / 100</span></p>
              <p><strong>Risk Category:</strong> <span className="badge badge-danger">{selectedItem.risk_level}</span></p>
            </div>

            <h4>Factor Breakdown</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {selectedItem.scores && Object.entries(selectedItem.scores).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</span>
                  <strong>{v} pts</strong>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setSelectedItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
