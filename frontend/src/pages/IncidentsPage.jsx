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
    plastic_type: 'SINGLE_USE_BAGS',
    water_overflow_cm: 15,
    description: '',
    source: 'FIELD_REPORT',
    verified: false
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
        setNewIncident(prev => ({ ...prev, drain_id: drainRes.data[0].id }))
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
        drain_id: parseInt(newIncident.drain_id),
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
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false
    if (plasticFilter !== 'ALL' && inc.plastic_type !== plasticFilter) return false
    if (search) {
      const term = search.toLowerCase()
      const matchDesc = inc.description?.toLowerCase().includes(term)
      const matchDrain = inc.drain_code?.toLowerCase().includes(term)
      if (!matchDesc && !matchDrain) return false
    }
    return true
  })

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
          <div className="stat-desc">Historical & field reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High / Critical Blockages</div>
          <div className="stat-value text-danger">
            {incidents.filter(i => ['HIGH', 'CRITICAL'].includes(i.severity)).length}
          </div>
          <div className="stat-desc">Severe flow restriction or overflow</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Plastic-Dominated Blockages</div>
          <div className="stat-value text-warning">
            {incidents.filter(i => i.blockage_cause === 'PLASTIC_ACCUMULATION' || (i.plastic_density && i.plastic_density !== 'NONE')).length}
          </div>
          <div className="stat-desc">Plastic bags, bottles, packaging</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verified Official Records</div>
          <div className="stat-value text-success">
            {incidents.filter(i => i.verified).length}
          </div>
          <div className="stat-desc">Inspected by municipal officers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Search Description / Drain Code
            </label>
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Severity Level
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Plastic Waste Type
            </label>
            <select
              value={plasticFilter}
              onChange={(e) => setPlasticFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Plastic Types</option>
              <option value="SINGLE_USE_BAGS">Single-use Plastic Bags</option>
              <option value="PET_BOTTLES">PET Bottles & Containers</option>
              <option value="PACKAGING_WRAP">Packaging Wrappers</option>
              <option value="STYROFOAM">Styrofoam / Expanded Poly</option>
              <option value="MIXED_PLASTIC">Mixed Plastic Debris</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Incidents Log ({filteredIncidents.length})</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-info">OFFICIAL / FIELD / DEMO TAGGED</span>
          </div>
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
                  <th>Ward</th>
                  <th>Severity</th>
                  <th>Cause</th>
                  <th>Plastic Density</th>
                  <th>Plastic Type</th>
                  <th>Water Overflow</th>
                  <th>Verified</th>
                  <th>Data Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No blockage incidents found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => (
                    <tr key={inc.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {inc.incident_date} <span style={{ color: 'var(--text-muted)' }}>{inc.incident_time || ''}</span>
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                        {inc.drain_code || `Drain #${inc.drain_id}`}
                      </td>
                      <td>{inc.ward_name || '-'}</td>
                      <td>
                        <span className={`badge ${
                          inc.severity === 'CRITICAL' ? 'badge-danger' :
                          inc.severity === 'HIGH' ? 'badge-warning' :
                          inc.severity === 'MEDIUM' ? 'badge-info' : 'badge-success'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{inc.blockage_cause || 'PLASTIC'}</td>
                      <td>
                        <span className={`badge ${
                          inc.plastic_density === 'HIGH' ? 'badge-danger' :
                          inc.plastic_density === 'MEDIUM' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {inc.plastic_density || 'N/A'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{(inc.plastic_type || '-').replace(/_/g, ' ')}</td>
                      <td>{inc.water_overflow_cm ? `${inc.water_overflow_cm} cm` : '0 cm'}</td>
                      <td>
                        {inc.verified ? (
                          <span className="badge badge-success">✓ Verified</span>
                        ) : (
                          <span className="badge badge-warning">Unverified</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>
                          {inc.source || 'FIELD_REPORT'}
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

      {/* Modal for adding field incident */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '550px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>📝 Log Field Blockage Incident</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">Drain Location</label>
                  <select
                    className="form-control"
                    value={newIncident.drain_id}
                    onChange={(e) => setNewIncident({ ...newIncident, drain_id: e.target.value })}
                    required
                  >
                    {drains.map(d => (
                      <option key={d.id} value={d.id}>{d.drain_code} - {d.name}</option>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">Time of Incident</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
                  <label className="form-label">Primary Plastic Type</label>
                  <select
                    className="form-control"
                    value={newIncident.plastic_type}
                    onChange={(e) => setNewIncident({ ...newIncident, plastic_type: e.target.value })}
                  >
                    <option value="SINGLE_USE_BAGS">Carry Bags / Carry-alls</option>
                    <option value="PET_BOTTLES">PET Bottles & Containers</option>
                    <option value="PACKAGING_WRAP">Packaging Wrapper / Film</option>
                    <option value="STYROFOAM">Styrofoam / Thermocol</option>
                    <option value="MIXED_PLASTIC">Mixed Municipal Plastic</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">Water Overflow Level (cm)</label>
                <input
                  type="number"
                  className="form-control"
                  value={newIncident.water_overflow_cm}
                  onChange={(e) => setNewIncident({ ...newIncident, water_overflow_cm: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Observations / Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Note specific details (e.g., origin near local market, culvert clogged by accumulated single-use plastics)..."
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
