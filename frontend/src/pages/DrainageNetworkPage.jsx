import React, { useState, useEffect } from 'react'
import { drainAPI } from '../api/client'

export default function DrainageNetworkPage() {
  const [drains, setDrains] = useState([])
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
  const [wardFilter, setWardFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [conditionFilter, setConditionFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [drainsRes, wardsRes] = await Promise.all([
        drainAPI.getAll(),
        drainAPI.getWards()
      ])
      setDrains(drainsRes.data || [])
      setWards(wardsRes.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load drainage network data.')
    } finally {
      setLoading(false)
    }
  }

  const filteredDrains = drains.filter((d) => {
    if (wardFilter !== 'ALL' && d.ward_id !== parseInt(wardFilter)) return false
    if (typeFilter !== 'ALL' && d.drain_type !== typeFilter) return false
    if (conditionFilter !== 'ALL' && d.condition !== conditionFilter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchName = d.drain_code.toLowerCase().includes(term) || d.name?.toLowerCase().includes(term)
      if (!matchName) return false
    }
    return true
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🌊 Drainage Network Infrastructure</h1>
          <p className="page-subtitle">
            Madurai Municipal Drainage Channels, Underground Culverts & Major Storm Outfalls
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={fetchData}>🔄 Refresh Data</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Drain Segments</div>
          <div className="stat-value text-accent">{drains.length}</div>
          <div className="stat-desc">Mapped across 4 municipal wards</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical / Poor Condition</div>
          <div className="stat-value text-danger">
            {drains.filter(d => ['CRITICAL', 'POOR'].includes(d.condition)).length}
          </div>
          <div className="stat-desc">Requires immediate desilting / maintenance</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Primary Outfall Drains</div>
          <div className="stat-value text-warning">
            {drains.filter(d => d.drain_type === 'PRIMARY').length}
          </div>
          <div className="stat-desc">Main trunk channels feeding Vaigai River</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Network Length</div>
          <div className="stat-value text-info">
            {(drains.reduce((sum, d) => sum + (d.length_meters || 0), 0) / 1000).toFixed(2)} km
          </div>
          <div className="stat-desc">GIS-mapped length</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Search Drain Code / Name
            </label>
            <input
              type="text"
              placeholder="Filter by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Ward
            </label>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Wards (4)</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>Ward {w.ward_number} - {w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Drain Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Types</option>
              <option value="PRIMARY">Primary Trunk Channel</option>
              <option value="SECONDARY">Secondary Feeder Drain</option>
              <option value="TERTIARY">Tertiary Neighborhood Drain</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Condition
            </label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Conditions</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Network Segments ({filteredDrains.length})</h3>
          <span className="badge badge-info">OPENSTREETMAP MADURAI GIS NETWORK</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading network segments...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Ward</th>
                  <th>Type</th>
                  <th>Width x Depth</th>
                  <th>Length</th>
                  <th>Material</th>
                  <th>Condition</th>
                  <th>Capacity</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrains.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No drain segments match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredDrains.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                        {d.drain_code}
                      </td>
                      <td>{d.name || 'Unnamed Drain'}</td>
                      <td>Ward {d.ward?.ward_number || d.ward_id} ({d.ward?.name})</td>
                      <td>
                        <span className={`badge ${
                          d.drain_type === 'PRIMARY' ? 'badge-danger' : d.drain_type === 'SECONDARY' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {d.drain_type}
                        </span>
                      </td>
                      <td>{d.width_meters}m × {d.depth_meters}m</td>
                      <td>{d.length_meters}m</td>
                      <td>{d.material || 'Concrete Box'}</td>
                      <td>
                        <span className={`badge ${
                          d.condition === 'GOOD' ? 'badge-success' :
                          d.condition === 'FAIR' ? 'badge-info' :
                          d.condition === 'POOR' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {d.condition}
                        </span>
                      </td>
                      <td>{d.capacity_m3s ? `${d.capacity_m3s} m³/s` : 'N/A'}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>
                          {d.source || 'OPENSTREETMAP_MADURAI'}
                        </span>
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
