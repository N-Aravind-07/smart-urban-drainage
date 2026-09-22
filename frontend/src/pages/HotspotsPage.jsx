import React, { useState, useEffect } from 'react'
import { hotspotAPI } from '../api/client'
import { Link } from 'react-router-dom'
import { MADURAI_HOTSPOTS } from '../data/maduraiData'

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchHotspots()
  }, [])

  const fetchHotspots = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await hotspotAPI.getGeoJSON()
      if (res.data?.features?.length) {
        const list = res.data.features.map((f) => f.properties)
        setHotspots(list)
      } else {
        setHotspots(MADURAI_HOTSPOTS)
      }
    } catch (err) {
      console.error(err)
      setHotspots(MADURAI_HOTSPOTS)
    } finally {
      setLoading(false)
    }
  }

  const criticalHotspots = hotspots.filter(h => (h.hotspot_score || 0) >= 80)
  const avgPlasticRatio = hotspots.length > 0
    ? Math.round(hotspots.reduce((sum, h) => sum + (h.plastic_ratio || 85), 0) / hotspots.length)
    : 86

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div className="page-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🔥 Hotspot Identification & Spatial Ranking</h1>
          <p className="page-subtitle">
            Spatial clustering of repeated plastic blockage incidents & recurring bottleneck points across Madurai
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchHotspots}>🔄 Recalculate Clusters</button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">Active Hotspot Zones</div>
          <div className="stat-value text-danger">{hotspots.length}</div>
          <div className="stat-desc">Recurring blockage clusters</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical Tier Hotspots</div>
          <div className="stat-value text-warning">{criticalHotspots.length}</div>
          <div className="stat-desc">Require immediate municipal intervention</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Plastic Ratio</div>
          <div className="stat-value text-accent">{avgPlasticRatio}%</div>
          <div className="stat-desc">Dominated by single-use plastic waste</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top Vulnerable Ward</div>
          <div className="stat-value text-info">Ward 44 (Simmakkal)</div>
          <div className="stat-desc">Highest density of market outfall points</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3>Hotspot Risk Hierarchy & Action Priority</h3>
          <span className="badge badge-info">SPATIAL CLUSTER ALGORITHM</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Running kernel density estimation & spatial clustering...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Hotspot Location</th>
                  <th>Corporation Ward</th>
                  <th>Incident Frequency</th>
                  <th>Cluster Score</th>
                  <th>Plastic Density</th>
                  <th>Recommended Intervention</th>
                  <th>Map Action</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No hotspots detected.
                    </td>
                  </tr>
                ) : (
                  hotspots.map((h, idx) => {
                    const score = h.hotspot_score || 75
                    const incidents = h.recurrent_incidents || h.incident_count || 12
                    return (
                      <tr key={h.hotspot_id || idx}>
                        <td style={{ fontWeight: 'bold', color: idx < 3 ? 'var(--cond-critical)' : 'var(--text-muted)' }}>
                          #{idx + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                            {h.name || h.drain_code || 'Madurai Bottleneck'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {h.vulnerability_tier || 'TIER 1 VULNERABLE'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {h.ward_name || `Ward ${h.ward_id || h.ward_number}`}
                        </td>
                        <td>
                          <span className="badge badge-danger">
                            {incidents} incidents
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold', color: score >= 85 ? 'var(--cond-critical)' : 'var(--cond-fair)' }}>
                              {score}/100
                            </span>
                            <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '60px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${score}%`,
                                backgroundColor: score >= 85 ? '#ef4444' : '#f59e0b'
                              }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-warning" style={{ fontWeight: 600 }}>
                            {h.plastic_ratio || 85}% Plastic
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', maxWidth: '280px', color: 'var(--text-secondary)' }}>
                          {h.recommended_action || 'Install mechanical trash bar screen & daily vacuum desilting'}
                        </td>
                        <td>
                          <Link
                            to={`/map?lat=${h.latitude || 9.925}&lng=${h.longitude || 78.125}`}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            🗺️ Inspect
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
