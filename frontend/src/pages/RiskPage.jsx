import React, { useState, useEffect } from 'react'
import { riskAPI } from '../api/client'
import Pagination from '../components/common/Pagination'

export default function RiskPage() {
  const [riskItems, setRiskItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [tierFilter, setTierFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  useEffect(() => {
    setCurrentPage(1)
  }, [tierFilter, search])

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
    const rLevel = (item.risk_level || item.risk_category || 'MEDIUM').toUpperCase()
    if (tierFilter !== 'ALL') {
      const fTier = tierFilter.toUpperCase()
      if (fTier === 'HIGH' && !rLevel.includes('HIGH')) return false
      if (fTier === 'MEDIUM' && !rLevel.includes('MEDIUM')) return false
      if (fTier === 'LOW' && !rLevel.includes('LOW')) return false
    }
    if (search) {
      const term = search.toLowerCase().trim()
      const matchCode = (item.drain_id || item.drain_code || '').toLowerCase().includes(term)
      const matchName = (item.drain_name || '').toLowerCase().includes(term)
      const matchWard = (item.ward_name || '').toLowerCase().includes(term)
      if (!matchCode && !matchName && !matchWard) return false
    }
    return true
  })

  const highCount = riskItems.filter(i => (i.risk_level || i.risk_category || '').toUpperCase().includes('HIGH')).length
  const mediumCount = riskItems.filter(i => (i.risk_level || i.risk_category || '').toUpperCase().includes('MEDIUM')).length
  const lowCount = riskItems.filter(i => (i.risk_level || i.risk_category || '').toUpperCase().includes('LOW')).length
  const maxScore = riskItems.length > 0 ? Math.round(Math.max(...riskItems.map(i => i.total_score || i.risk_score || 0))) : 0

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div className="page-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">⚠️ Multi-Factor Blockage Risk Scoring</h1>
          <p className="page-subtitle">
            Transparent weighted formula combining hydrology, plastic density, history & slope metrics across Madurai
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchRiskScores}>🔄 Re-compute Formula</button>
      </div>

      {/* Formula Explainer Banner */}
      <div className="card mb-4" style={{ borderLeft: '4px solid var(--accent-warning)', padding: '16px' }}>
        <h4 style={{ marginBottom: '8px', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🧮 Multi-Factor Risk Assessment Index Formula
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '13px' }}>
          <div>• <strong>Historical Incidents:</strong> 30%</div>
          <div>• <strong>Rainfall Sensitivity:</strong> 20%</div>
          <div>• <strong>Plastic Density:</strong> 20%</div>
          <div>• <strong>Channel Condition:</strong> 10%</div>
          <div>• <strong>Land Use / Market:</strong> 10%</div>
          <div>• <strong>Cleaning Recency:</strong> 10%</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">HIGH RISK CHANNELS</div>
          <div className="stat-value text-danger">{highCount}</div>
          <div className="stat-desc">Immediate desilting priority</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MEDIUM RISK CHANNELS</div>
          <div className="stat-value text-warning">{mediumCount}</div>
          <div className="stat-desc">Scheduled maintenance target</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">LOW RISK CHANNELS</div>
          <div className="stat-value text-success">{lowCount}</div>
          <div className="stat-desc">Normal operating baseline</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MAX RISK SCORE</div>
          <div className="stat-value text-accent">{maxScore}/100</div>
          <div className="stat-desc">Peak vulnerability index in network</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Search Drain Code / Name / Ward
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Search (e.g. Goripalayam, Simmakkal, MDU-DRN-001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Risk Tier
            </label>
            <select
              className="form-control"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="HIGH">High Risk ({highCount})</option>
              <option value="MEDIUM">Medium Risk ({mediumCount})</option>
              <option value="LOW">Low Risk ({lowCount})</option>
            </select>
          </div>
          {(tierFilter !== 'ALL' || search) && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
                onClick={() => {
                  setTierFilter('ALL')
                  setSearch('')
                }}
              >
                ✕ Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Calculated Risk Index ({filtered.length} Drains)</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Page {currentPage} of {Math.max(1, Math.ceil(filtered.length / pageSize))}</span>
          </div>
          <span className="badge badge-info">WEIGHTED MULTI-FACTOR MODEL</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Evaluating 6-factor risk matrix across network...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div>
            <div className="table-responsive-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Drain Channel</th>
                    <th>Location</th>
                    <th>Risk Score</th>
                    <th>Risk Level</th>
                    <th>Plastic Load</th>
                    <th>Action Needed</th>
                    <th>Diagnostic</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No drain channels match the selected filter. Try selecting 'All Risk Tiers'.
                      </td>
                    </tr>
                  ) : (
                    filtered
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((item) => {
                        const score = Math.round(item.total_score || item.risk_score || 0)
                        const level = (item.risk_level || item.risk_category || 'MEDIUM').toUpperCase()
                        return (
                          <tr key={item.drain_id || item.id}>
                            <td>
                              <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-blue)' }}>
                                {item.drain_code || item.drain_id}
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                                {item.drain_name || item.name}
                              </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>
                              {item.ward_name || `Ward ${item.ward_id}`}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontWeight: 'bold',
                                  fontSize: '15px',
                                  color: score >= 70 ? 'var(--cond-critical)' :
                                         score >= 45 ? 'var(--cond-fair)' : 'var(--cond-good)'
                                }}>
                                  {score}
                                </span>
                                <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '70px', overflow: 'hidden' }}>
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
                              <span style={{ fontWeight: 600, fontSize: '12px' }}>
                                {item.plastic_ratio || 75}% plastic debris
                              </span>
                            </td>
                            <td style={{ fontSize: '12px', maxWidth: '240px' }}>
                              {item.recommended_action || (score >= 70 ? '🔥 High Priority Trash Trap' : score >= 45 ? '🔧 Desilting & Screen Check' : '✅ Routine Monitoring')}
                            </td>
                            <td>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                                onClick={() => setSelectedItem(item)}
                              >
                                🔍 Breakdown
                              </button>
                            </td>
                          </tr>
                        )
                      })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '520px', maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3>Risk Breakdown: {selectedItem.drain_code || selectedItem.drain_id}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedItem.drain_name}</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>✕</button>
            </div>
            
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Computed Score</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: selectedItem.total_score >= 70 ? '#ef4444' : '#f59e0b' }}>
                  {Math.round(selectedItem.total_score || selectedItem.risk_score || 0)} / 100
                </div>
              </div>
              <div>
                <span className={`badge ${
                  (selectedItem.risk_level || '').toUpperCase() === 'HIGH' ? 'badge-danger' :
                  (selectedItem.risk_level || '').toUpperCase() === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                }`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                  {selectedItem.risk_level || 'MEDIUM'} RISK TIER
                </span>
              </div>
            </div>

            <h4 style={{ marginBottom: '12px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Component Factor Contribution
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Historical Incidents (30%)', val: selectedItem.historical_component || Math.round(selectedItem.total_score * 0.3) },
                { label: 'Rainfall Sensitivity (20%)', val: selectedItem.rainfall_component || Math.round(selectedItem.total_score * 0.2) },
                { label: 'Plastic Accumulation Density (20%)', val: selectedItem.plastic_component || Math.round(selectedItem.total_score * 0.2) },
                { label: 'Channel Condition & Silt (10%)', val: selectedItem.condition_component || Math.round(selectedItem.total_score * 0.1) },
                { label: 'Land Use / Market Proximity (10%)', val: selectedItem.landuse_component || Math.round(selectedItem.total_score * 0.1) },
                { label: 'Cleaning Recency Factor (10%)', val: selectedItem.cleaning_component || Math.round(selectedItem.total_score * 0.1) },
              ].map((f, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                    <span>{f.label}</span>
                    <strong>{f.val} pts</strong>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, f.val * 3.3)}%`, height: '100%', backgroundColor: 'var(--accent-blue)' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setSelectedItem(null)}>Close Diagnostic</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
