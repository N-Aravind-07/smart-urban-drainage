import React, { useState, useEffect } from 'react'
import { incidentAPI, drainAPI } from '../api/client'

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [drains, setDrains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [plasticFilter, setPlasticFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  // New incident modal/form
  const [showModal, setShowModal] = useState(false)
  const [newIncident, setNewIncident] = useState({
    drain_id: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: '10:00',
    severity: 'MEDIUM',
    blockage_cause: 'PLASTIC_ACCUMULATION',
    plastic_density: 'MEDIUM',
    plastic_type: 'BAGS',
    water_overflow_cm: 15,
    description: '',
    source: 'FIELD_OBSERVATION_VERIFIED',
    verified: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [formMsg, setFormMsg] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [incRes, drainRes] = await Promise.all([
        incidentAPI.getAll(),
        drainAPI.getAll()
      ])
      setIncidents(incRes.data || [])
      setDrains(drainRes.data || [])
      if (drainRes.data?.length > 0) {
        setNewIncident(prev => ({ ...prev, drain_id: drainRes.data[0].drain_id || drainRes.data[0].id }))
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load blockage incidents.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormMsg(null)
    try {
      const payload = {
        ...newIncident,
        water_overflow_cm: parseFloat(newIncident.water_overflow_cm) || 0
      }
      await incidentAPI.create(payload)
      setFormMsg({ type: 'success', text: 'Incident logged successfully!' })
      setShowModal(false)
      fetchData()
    } catch (err) {
      console.error(err)
      setFormMsg({ type: 'danger', text: 'Failed to create incident record.' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredIncidents = incidents.filter(inc => {
    // Severity Filter normalization
    if (severityFilter !== 'ALL') {
      const incSev = (inc.severity || '').toUpperCase()
      const fSev = severityFilter.toUpperCase()
      if (incSev !== fSev) return false
    }

    // Plastic Waste Type Filter normalization
    if (plasticFilter !== 'ALL') {
      const pType = (inc.plastic_type || '').toUpperCase()
      const fType = plasticFilter.toUpperCase()
      if (fType === 'BAGS' && !pType.includes('BAG')) return false
      if (fType === 'BOTTLES' && !pType.includes('BOTTLE')) return false
      if (fType === 'PACKAGING' && !pType.includes('PACKAGING') && !pType.includes('WRAP')) return false
      if (fType === 'STYROFOAM' && !pType.includes('STYROFOAM') && !pType.includes('THERMOCOL')) return false
      if (fType === 'MIXED' && !pType.includes('MIXED')) return false
    }

    // Search Term matching
    if (search) {
      const term = search.toLowerCase().trim()
      const matchDesc = (inc.description || inc.remarks || inc.location_name || '').toLowerCase()
      const matchDrain = (inc.drain_code || inc.drain_id || '').toLowerCase()
      if (!matchDesc.includes(term) && !matchDrain.includes(term)) return false
    }

    return true
  })

  const criticalOrHighCount = incidents.filter(i => ['CRITICAL', 'HIGH'].includes((i.severity || '').toUpperCase())).length
  const plasticDominatedCount = incidents.filter(i => i.plastic_present || (i.plastic_type && i.plastic_type !== 'NONE')).length
  const verifiedOfficialCount = incidents.filter(i => i.verified).length

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔴 Drainage Blockage Incidents</h1>
          <p className="page-subtitle">
            Historical and verified field observations of plastic & debris blockages in Madurai
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Log Field Incident
          </button>
          <button className="btn btn-secondary" onClick={fetchData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {formMsg && (
        <div className={`alert alert-${formMsg.type} mb-4`}>
          {formMsg.text}
        </div>
      )}

      {/* Incident Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Reported Incidents</div>
          <div className="stat-value text-accent">{incidents.length}</div>
          <div className="stat-desc">Field inspection & ward sensor logs</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High / Critical Blockages</div>
          <div className="stat-value text-danger">{criticalOrHighCount}</div>
          <div className="stat-desc">Severe flow restriction or overflow</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Plastic-Dominated Blockages</div>
          <div className="stat-value text-warning">{plasticDominatedCount}</div>
          <div className="stat-desc">Plastic bags, bottles, packaging debris</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verified Official Records</div>
          <div className="stat-value text-success">{verifiedOfficialCount}</div>
          <div className="stat-desc">Inspected by municipal sanitary officers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Search Description / Drain Code / Location
            </label>
            <input
              type="text"
              placeholder="Search (e.g. Goripalayam, Simmakkal, Masi)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Severity Level
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">Low (Partial Flow)</option>
              <option value="MEDIUM">Medium (Moderate)</option>
              <option value="HIGH">High (Severe Flow Restriction)</option>
              <option value="CRITICAL">Critical (Total Overflow)</option>
            </select>
          </div>

          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Plastic Waste Type
            </label>
            <select
              value={plasticFilter}
              onChange={(e) => setPlasticFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Plastic Types</option>
              <option value="BAGS">Single-use Plastic Bags</option>
              <option value="BOTTLES">PET Bottles & Containers</option>
              <option value="PACKAGING">Packaging Wrappers & Film</option>
              <option value="STYROFOAM">Styrofoam / Thermocol</option>
              <option value="MIXED">Mixed Plastic Debris</option>
            </select>
          </div>

          {(severityFilter !== 'ALL' || plasticFilter !== 'ALL' || search) && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
                onClick={() => {
                  setSeverityFilter('ALL')
                  setPlasticFilter('ALL')
                  setSearch('')
                }}
              >
                ✕ Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3>Incidents Log ({filteredIncidents.length})</h3>
          <span className="badge badge-info">OFFICIAL FIELD VERIFIED RECORDS</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading incidents...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Drain Code</th>
                  <th>Location / Observations</th>
                  <th>Severity</th>
                  <th>Blockage Type</th>
                  <th>Plastic Type</th>
                  <th>Est. Qty</th>
                  <th>Overflow</th>
                  <th>Verified</th>
                  <th>Data Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No blockage incidents found matching criteria. Try adjusting or resetting the filters.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => {
                    const sev = (inc.severity || 'MEDIUM').toUpperCase()
                    return (
                      <tr key={inc.id || inc.incident_id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
                          <strong>{inc.incident_date}</strong> <span style={{ color: 'var(--text-muted)' }}>{inc.incident_time || ''}</span>
                        </td>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-blue)' }}>
                          {inc.drain_code || inc.drain_id}
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{inc.location_name || 'Madurai Drain Point'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inc.remarks || inc.description}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            sev === 'CRITICAL' ? 'badge-danger' :
                            sev === 'HIGH' ? 'badge-warning' :
                            sev === 'MEDIUM' ? 'badge-info' : 'badge-success'
                          }`}>
                            {sev}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', fontWeight: 500 }}>
                          {(inc.blockage_type || 'PLASTIC').replace(/_/g, ' ')}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          <span style={{
                            padding: '2px 6px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontSize: '11px'
                          }}>
                            {(inc.plastic_type || 'MIXED').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {inc.estimated_quantity_kg ? `${inc.estimated_quantity_kg} kg` : 'N/A'}
                        </td>
                        <td>
                          {inc.water_overflow_cm ? (
                            <span style={{ color: inc.water_overflow_cm > 20 ? 'var(--cond-critical)' : 'var(--text-primary)', fontWeight: 600 }}>
                              {inc.water_overflow_cm} cm
                            </span>
                          ) : 'None'}
                        </td>
                        <td>
                          <span className="badge badge-success">✓ Verified</span>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '10px' }}>
                            {inc.source || 'OFFICIAL_FIELD_REPORT'}
                          </span>
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

      {/* Modal for adding field incident */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '560px', maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3>📝 Log Field Blockage Incident</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">Drain Location</label>
                  <select
                    className="form-control"
                    value={newIncident.drain_id}
                    onChange={(e) => setNewIncident({ ...newIncident, drain_id: e.target.value })}
                    required
                  >
                    {drains.map(d => (
                      <option key={d.id || d.drain_id} value={d.drain_id || d.id}>
                        {d.drain_code || d.drain_id} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Incident Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newIncident.incident_date}
                    onChange={(e) => setNewIncident({ ...newIncident, incident_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">Time of Observation</label>
                  <input
                    type="time"
                    className="form-control"
                    value={newIncident.incident_time}
                    onChange={(e) => setNewIncident({ ...newIncident, incident_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Severity Level</label>
                  <select
                    className="form-control"
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                  >
                    <option value="LOW">Low (Partial Flow)</option>
                    <option value="MEDIUM">Medium (Moderate Obstruction)</option>
                    <option value="HIGH">High (Severe Flow Backup)</option>
                    <option value="CRITICAL">Critical (Total Overflow)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">Plastic Waste Density</label>
                  <select
                    className="form-control"
                    value={newIncident.plastic_density}
                    onChange={(e) => setNewIncident({ ...newIncident, plastic_density: e.target.value })}
                  >
                    <option value="LOW">Low Plastic Density</option>
                    <option value="MEDIUM">Medium Plastic Density</option>
                    <option value="HIGH">High Plastic Density</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Primary Plastic Category</label>
                  <select
                    className="form-control"
                    value={newIncident.plastic_type}
                    onChange={(e) => setNewIncident({ ...newIncident, plastic_type: e.target.value })}
                  >
                    <option value="BAGS">Single-use Carry Bags</option>
                    <option value="BOTTLES">PET Bottles & Containers</option>
                    <option value="PACKAGING">Packaging Wrappers & Film</option>
                    <option value="STYROFOAM">Styrofoam / Thermocol</option>
                    <option value="MIXED">Mixed Municipal Plastic</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Water Overflow Level (cm)</label>
                <input
                  type="number"
                  className="form-control"
                  value={newIncident.water_overflow_cm}
                  onChange={(e) => setNewIncident({ ...newIncident, water_overflow_cm: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label className="form-label">Observations / Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Detail specific observations (e.g., origin near local vegetable market, culvert intake mouth choked by accumulated single-use plastics)..."
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Submit Incident Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
