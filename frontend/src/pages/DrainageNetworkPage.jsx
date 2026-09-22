import React, { useState, useEffect } from 'react'
import { drainAPI } from '../api/client'
import Pagination from '../components/common/Pagination'

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [wardFilter, typeFilter, conditionFilter, searchTerm])

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
    // Ward Filter normalization
    if (wardFilter !== 'ALL' && String(d.ward_id) !== String(wardFilter)) {
      return false
    }

    // Drain Type Filter normalization
    if (typeFilter !== 'ALL') {
      const dType = (d.drain_type || '').toUpperCase()
      const fType = typeFilter.toUpperCase()
      if (fType === 'PRIMARY' && !dType.includes('PRIMARY') && !dType.includes('CANAL') && !dType.includes('RIVER')) {
        return false
      }
      if (fType === 'SECONDARY' && !dType.includes('SECONDARY') && !dType.includes('CULVERT') && !dType.includes('DRAIN')) {
        return false
      }
      if (fType === 'TERTIARY' && !dType.includes('TERTIARY') && !dType.includes('STREET') && !dType.includes('NEIGHBORHOOD')) {
        return false
      }
    }

    // Condition Filter normalization (case-insensitive)
    if (conditionFilter !== 'ALL') {
      const dCond = (d.condition || '').toUpperCase()
      const fCond = conditionFilter.toUpperCase()
      if (dCond !== fCond) {
        return false
      }
    }

    // Search Term matching
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim()
      const code = (d.drain_code || d.drain_id || '').toLowerCase()
      const name = (d.name || '').toLowerCase()
      const mat = (d.material || '').toLowerCase()
      const wardName = (d.ward_name || '').toLowerCase()
      if (!code.includes(term) && !name.includes(term) && !mat.includes(term) && !wardName.includes(term)) {
        return false
      }
    }

    return true
  })

  const totalLengthKm = (drains.reduce((sum, d) => sum + (d.length_m || d.length_meters || 0), 0) / 1000).toFixed(2)
  const criticalCount = drains.filter(d => ['CRITICAL', 'POOR'].includes((d.condition || '').toUpperCase())).length
  const primaryCount = drains.filter(d => (d.drain_type || '').toUpperCase().includes('PRIMARY') || (d.drain_type || '').toUpperCase().includes('CANAL')).length
  const uniqueWardsCount = new Set(drains.map(d => d.ward_id)).size

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
          <div className="stat-desc">Mapped across {uniqueWardsCount || wards.length} municipal wards</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical / Poor Condition</div>
          <div className="stat-value text-danger">{criticalCount}</div>
          <div className="stat-desc">Requires immediate desilting / maintenance</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Primary Outfall Channels</div>
          <div className="stat-value text-warning">{primaryCount}</div>
          <div className="stat-desc">Main trunk channels feeding Vaigai River basin</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Network Length</div>
          <div className="stat-value text-info">{totalLengthKm} km</div>
          <div className="stat-desc">Verified GIS-mapped network length</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Search Drain Code / Name
            </label>
            <input
              type="text"
              placeholder="Search (e.g. Vaigai, Simmakkal, Goripalayam)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Corporation Ward
            </label>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Madurai Wards ({wards.length})</option>
              {wards.map((w) => (
                <option key={w.id || w.ward_id} value={w.id || w.ward_id}>
                  Ward {w.ward_number || w.ward_id} — {w.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '170px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Drain Classification
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Classifications</option>
              <option value="PRIMARY">Primary Trunk Channel</option>
              <option value="SECONDARY">Secondary Feeder Drain</option>
              <option value="TERTIARY">Tertiary Neighborhood Conduit</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Hydraulic Condition
            </label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Conditions</option>
              <option value="GOOD">Good Condition</option>
              <option value="FAIR">Fair Condition</option>
              <option value="POOR">Poor / Silted</option>
              <option value="CRITICAL">Critical Blockage</option>
            </select>
          </div>

          {(wardFilter !== 'ALL' || typeFilter !== 'ALL' || conditionFilter !== 'ALL' || searchTerm) && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
                onClick={() => {
                  setWardFilter('ALL')
                  setTypeFilter('ALL')
                  setConditionFilter('ALL')
                  setSearchTerm('')
                }}
              >
                ✕ Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Network Segments ({filteredDrains.length})</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Page {currentPage} of {Math.max(1, Math.ceil(filteredDrains.length / pageSize))}</span>
          </div>
          <span className="badge badge-info">MADURAI CORPORATION GIS NETWORK</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading network segments...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div>
            <div className="table-responsive-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Channel / Drain Name</th>
                    <th>Ward Location</th>
                    <th>Type</th>
                    <th>Width × Depth</th>
                    <th>Length</th>
                    <th>Construction</th>
                    <th>Condition</th>
                    <th>Plastic Debris</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrains.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No drain segments match the current filter selection. Try resetting filters above.
                      </td>
                    </tr>
                  ) : (
                    filteredDrains
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((d) => {
                        const cond = (d.condition || '').toUpperCase()
                        const type = (d.drain_type || '').toUpperCase()
                        return (
                          <tr key={d.id || d.drain_id}>
                            <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-blue)' }}>
                              {d.drain_code || d.drain_id}
                            </td>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>
                              {d.name || 'Madurai Waterway Channel'}
                            </td>
                            <td>
                              {d.ward_name || `Ward ${d.ward_id}`}
                            </td>
                            <td>
                              <span className={`badge ${
                                type.includes('PRIMARY') || type.includes('CANAL') ? 'badge-danger' :
                                type.includes('SECONDARY') || type.includes('CULVERT') ? 'badge-warning' : 'badge-info'
                              }`}>
                                {d.drain_type}
                              </span>
                            </td>
                            <td>
                              {d.width_m || d.width_meters || 2.5}m × {d.depth_m || d.depth_meters || 1.8}m
                            </td>
                            <td style={{ fontWeight: 500 }}>
                              {d.length_m || d.length_meters}m
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {d.material || 'RCC Culvert'}
                            </td>
                            <td>
                              <span className={`badge ${
                                cond === 'GOOD' ? 'badge-success' :
                                cond === 'FAIR' ? 'badge-info' :
                                cond === 'POOR' ? 'badge-warning' : 'badge-danger'
                              }`}>
                                {cond}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', width: '50px' }}>
                                  <div style={{
                                    width: `${d.plastic_debris_ratio || 50}%`,
                                    height: '100%',
                                    background: (d.plastic_debris_ratio || 50) > 80 ? 'var(--cond-critical)' : (d.plastic_debris_ratio || 50) > 60 ? 'var(--cond-poor)' : 'var(--cond-good)'
                                  }} />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 600 }}>{d.plastic_debris_ratio || 50}%</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success" style={{ fontSize: '10px' }}>
                                ● ACTIVE
                              </span>
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
              totalItems={filteredDrains.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  )
}
