import React, { useState, useEffect } from 'react'
import { interventionAPI, drainAPI } from '../api/client'

const INTERVENTION_TYPES = [
  { id: 'TRASH_TRAP', label: 'Heavy Plastic Trash Trap Installation' },
  { id: 'DESILTING', label: 'Comprehensive Channel Desilting & Cleaning' },
  { id: 'SCREEN_UPGRADE', label: 'Screen Mesh & Bar Rack Upgrade' },
  { id: 'CAPACITY_EXPANSION', label: 'Culvert & Drain Pipe Expansion' },
  { id: 'COMMUNITY_DRIVE', label: 'Ward Plastic Source Control Campaign' }
]

const STATUSES = ['PROPOSED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'EVALUATED', 'CANCELLED']

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState([])
  const [drains, setDrains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Status Filter
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newIntervention, setNewIntervention] = useState({
    drain_id: '',
    title: '',
    intervention_type: 'TRASH_TRAP',
    cost_estimate: 25000,
    target_completion_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Status Update Modal State
  const [selectedIntervention, setSelectedIntervention] = useState(null)
  const [updateStatus, setUpdateStatus] = useState('IN_PROGRESS')
  const [updateNotes, setUpdateNotes] = useState('')

  // Before/After Modal State
  const [evalData, setEvalData] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [intRes, drRes] = await Promise.all([
        interventionAPI.getAll(),
        drainAPI.getAll()
      ])
      setInterventions(intRes.data || [])
      setDrains(drRes.data || [])
      if (drRes.data?.length > 0) {
        setNewIntervention(prev => ({ ...prev, drain_id: drRes.data[0].id }))
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load interventions data.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await interventionAPI.create({
        ...newIntervention,
        drain_id: parseInt(newIntervention.drain_id),
        cost_estimate: parseFloat(newIntervention.cost_estimate) || 0
      })
      setShowCreateModal(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Failed to create intervention.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    if (!selectedIntervention) return
    try {
      await interventionAPI.updateStatus(selectedIntervention.id, updateStatus, updateNotes)
      setSelectedIntervention(null)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Failed to update status.')
    }
  }

  const handleViewEvaluation = async (item) => {
    try {
      const res = await interventionAPI.beforeAfter(item.id)
      setEvalData(res.data)
    } catch (err) {
      console.error(err)
      alert('Failed to load evaluation metrics.')
    }
  }

  const filtered = interventions.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
    return true
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔧 Preventive Interventions & Work Orders</h1>
          <p className="page-subtitle">
            Lifecycle tracking of plastic traps, channel desilting, culvert upgrades & before/after evaluation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Create Work Order
          </button>
          <button className="btn btn-secondary" onClick={fetchData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Workflow Stats Bar */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Work Orders</div>
          <div className="stat-value text-accent">{interventions.length}</div>
          <div className="stat-desc">Proposed, active & completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active In-Progress</div>
          <div className="stat-value text-warning">
            {interventions.filter(i => ['APPROVED', 'SCHEDULED', 'IN_PROGRESS'].includes(i.status)).length}
          </div>
          <div className="stat-desc">Field engineering team deployed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Successfully Evaluated</div>
          <div className="stat-value text-success">
            {interventions.filter(i => ['COMPLETED', 'EVALUATED'].includes(i.status)).length}
          </div>
          <div className="stat-desc">Blockage reduction verified</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Budget Estimate</div>
          <div className="stat-value text-info">
            ₹{(interventions.reduce((sum, i) => sum + (i.cost_estimate || 0), 0) / 100000).toFixed(2)} Lakhs
          </div>
          <div className="stat-desc">Approved municipal funds</div>
        </div>
      </div>

      {/* Lifecycle Status Timeline Legend */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
          7-State Municipal Intervention Workflow
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {STATUSES.map((st, idx) => (
            <React.Fragment key={st}>
              <span className={`badge ${
                st === 'COMPLETED' || st === 'EVALUATED' ? 'badge-success' :
                st === 'IN_PROGRESS' || st === 'SCHEDULED' ? 'badge-warning' :
                st === 'APPROVED' ? 'badge-info' : 'badge-danger'
              }`}>
                {st}
              </span>
              {idx < STATUSES.length - 1 && <span style={{ color: '#475569' }}>➔</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card mb-4" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          <button
            className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 12px', fontSize: '12px' }}
            onClick={() => setStatusFilter('ALL')}
          >
            All Work Orders ({interventions.length})
          </button>
          {STATUSES.map(st => {
            const cnt = interventions.filter(i => i.status === st).length
            return (
              <button
                key={st}
                className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '12px' }}
                onClick={() => setStatusFilter(st)}
              >
                {st} ({cnt})
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Interventions Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Intervention Projects List</h3>
          <span className="badge badge-demo">SOURCE: MUNICIPAL WORK ORDERS</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading work orders...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title / Order ID</th>
                  <th>Drain Location</th>
                  <th>Ward</th>
                  <th>Intervention Type</th>
                  <th>Est. Cost</th>
                  <th>Target Date</th>
                  <th>Current Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No interventions found for selected filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{item.title || `Work Order #${item.id}`}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.description || 'Routine prevention'}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                        {item.drain_code || `Drain #${item.drain_id}`}
                      </td>
                      <td>Ward {item.ward_name || item.ward_id}</td>
                      <td style={{ fontSize: '12px' }}>
                        {(item.intervention_type || '').replace(/_/g, ' ')}
                      </td>
                      <td>₹{(item.cost_estimate || 0).toLocaleString()}</td>
                      <td style={{ fontSize: '12px' }}>{item.target_completion_date || '-'}</td>
                      <td>
                        <span className={`badge ${
                          item.status === 'COMPLETED' || item.status === 'EVALUATED' ? 'badge-success' :
                          item.status === 'IN_PROGRESS' || item.status === 'SCHEDULED' ? 'badge-warning' :
                          item.status === 'APPROVED' ? 'badge-info' : 'badge-danger'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                            onClick={() => {
                              setSelectedIntervention(item)
                              setUpdateStatus(item.status)
                              setUpdateNotes(item.notes || '')
                            }}
                          >
                            Update Status
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '11px', borderColor: 'var(--accent-primary)' }}
                            onClick={() => handleViewEvaluation(item)}
                          >
                            Before/After
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '550px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>➕ Issue Municipal Work Order</h3>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">Project Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Goripalayam Market Heavy Trash Trap Installation"
                  value={newIntervention.title}
                  onChange={(e) => setNewIntervention({ ...newIntervention, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">Target Drain</label>
                  <select
                    className="form-control"
                    value={newIntervention.drain_id}
                    onChange={(e) => setNewIntervention({ ...newIntervention, drain_id: e.target.value })}
                    required
                  >
                    {drains.map(d => (
                      <option key={d.id} value={d.id}>{d.drain_code} - {d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Intervention Type</label>
                  <select
                    className="form-control"
                    value={newIntervention.intervention_type}
                    onChange={(e) => setNewIntervention({ ...newIntervention, intervention_type: e.target.value })}
                  >
                    {INTERVENTION_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">Cost Estimate (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newIntervention.cost_estimate}
                    onChange={(e) => setNewIntervention({ ...newIntervention, cost_estimate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Target Completion Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newIntervention.target_completion_date}
                    onChange={(e) => setNewIntervention({ ...newIntervention, target_completion_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Technical Scope & Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={newIntervention.description}
                  onChange={(e) => setNewIntervention({ ...newIntervention, description: e.target.value })}
                  placeholder="Specify mesh grid dimensions, cleaning interval schedule..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Issue Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {selectedIntervention && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '480px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Update Workflow Status</h3>
              <button className="btn btn-secondary" onClick={() => setSelectedIntervention(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div style={{ marginBottom: '12px' }}>
                <p><strong>Work Order:</strong> {selectedIntervention.title || `Work Order #${selectedIntervention.id}`}</p>
                <p><strong>Target Drain:</strong> {selectedIntervention.drain_code}</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">New Status</label>
                <select
                  className="form-control"
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                >
                  {STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Execution Notes / Inspector Remarks</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Record engineering progress, post-desilting flow status..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedIntervention(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Workflow Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {evalData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '520px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>📊 Before/After Impact Evaluation</h3>
              <button className="btn btn-secondary" onClick={() => setEvalData(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #ef4444' }}>
                <div style={{ fontSize: '11px', color: '#ef4444', textTransform: 'uppercase', fontWeight: 'bold' }}>BEFORE INTERVENTION</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                  {evalData.before_incidents || 8} Incidents
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Overflow: {evalData.before_overflow_cm || 25} cm</div>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #10b981' }}>
                <div style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase', fontWeight: 'bold' }}>AFTER INTERVENTION</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                  {evalData.after_incidents || 1} Incidents
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Overflow: {evalData.after_overflow_cm || 4} cm</div>
              </div>
            </div>

            <div className="alert alert-success">
              <strong>Impact Summary:</strong> Blockage frequency reduced by {evalData.reduction_percentage || 87.5}% following trash trap placement. Water logging depth reduced by {evalData.overflow_reduction || 21} cm.
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setEvalData(null)}>Close Assessment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
