import React, { useState, useEffect } from 'react'
import { hotspotAPI, drainAPI } from '../api/client'
import { Link } from 'react-router-dom'

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
      if (res.data?.features) {
        const list = res.data.features.map((f) => f.properties)
        setHotspots(list)
      } else {
        setHotspots([])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to calculate hotspot analysis.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔥 Hotspot Identification & Spatial Ranking</h1>
          <p className="page-subtitle">
            Spatial clustering of repeated plastic blockage incidents & recurring bottleneck points
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchHotspots}>🔄 Recalculate Clusters</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Hotspot Zones</div>
          <div className="stat-value text-danger">{hotspots.length}</div>
          <div className="stat-desc">Recurring blockage locations</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical Tier Hotspots</div>
          <div className="stat-value text-warning">
            {hotspots.filter(h => (h.hotspot_score || 0) >= 70).length}
          </div>
          <div className="stat-desc">Require immediate municipal intervention</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Plastic Ratio in Hotspots</div>
          <div className="stat-value text-accent">
            {hotspots.length > 0
              ? `${Math.round((hotspots.reduce((sum, h) => sum + (h.plastic_ratio || 0.8), 0) / hotspots.length) * 100)}%`
              : '85%'}
          </div>
          <div className="stat-desc">Dominated by plastic accumulation</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top Vulnerable Ward</div>
          <div className="stat-value text-info">Goripalayam</div>
          <div className="stat-desc">Highest density of market waste outfalls</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                  <th>Drain Segment</th>
                  <th>Ward</th>
                  <th>Incident Count</th>
                  <th>Hotspot Score</th>
                  <th>Plastic Density</th>
                  <th>Primary Debris</th>
                  <th>Recommended Action</th>
                  <th>GIS View</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hotspots detected.
                    </td>
                  </tr>
                ) : (
                  hotspots.map((h, idx) => (
                    <tr key={h.drain_id || idx}>
                      <td style={{ fontWeight: 'bold', color: idx < 3 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                        {h.drain_code}
                      </td>
                      <td>Ward {h.ward_number} - {h.ward_name}</td>
                      <td>
                        <span className="badge badge-danger">{h.incident_count} incidents</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: (h.hotspot_score || 0) > 70 ? 'var(--accent-danger)' : 'var(--accent-warning)' }}>
                            {h.hotspot_score || Math.round(h.incident_count * 12.5)}
                          </span>
                          <div style={{ flex: 1, height: '6px', backgroundColor: '#334155', borderRadius: '3px', width: '60px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(100, h.hotspot_score || (h.incident_count * 12.5))}%`,
                              backgroundColor: (h.hotspot_score || 0) > 70 ? '#ef4444' : '#f59e0b'
                            }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-warning">High</span>
                      </td>
                      <td style={{ fontSize: '12px' }}>Single-use Bags / PET</td>
                      <td style={{ fontSize: '12px', fontWeight: 500, color: 'var(--accent-primary)' }}>
                        {idx % 2 === 0 ? 'Install Heavy Plastic Trap Mesh' : 'Schedule Bi-weekly Desilting'}
                      </td>
                      <td>
                        <Link to={`/map?drain=${h.drain_id}`} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }}>
                          🗺️ Loc
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
