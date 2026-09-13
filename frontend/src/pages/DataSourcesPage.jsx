import React, { useState, useEffect } from 'react'
import { datasourceAPI } from '../api/client'

export default function DataSourcesPage() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await datasourceAPI.getAll()
      setSources(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to fetch data provenance metadata.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div className="page-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🗄️ Data Provenance & Verification Registry</h1>
          <p className="page-subtitle">
            Registry of verified OpenStreetMap spatial vector networks & municipal blockage records for Madurai
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSources}>🔄 Refresh Registry</button>
      </div>

      <div className="card mb-4" style={{ borderLeft: '4px solid var(--accent-info)', padding: '16px' }}>
        <h4 style={{ color: 'var(--accent-info)', marginBottom: '8px' }}>
          🛡️ Spatial GIS Data Registry
        </h4>
        <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>
          This registry details the spatial GIS vector datasets, satellite outfall surveys, and field observation records for Madurai City.
        </p>
      </div>

      {/* Datasets Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Registered Data Sets ({sources.length})</h3>
          <span className="badge badge-info">VERIFICATION REGISTRY</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading dataset metadata...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Category</th>
                  <th>Record Count</th>
                  <th>Verification Level</th>
                  <th>Data Source / Provider</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((ds) => (
                  <tr key={ds.id || ds.dataset_name || ds.name}>
                    <td style={{ fontWeight: 600 }}>{ds.dataset_name || ds.name}</td>
                    <td>{ds.source_category || ds.category || 'Drainage GIS'}</td>
                    <td><strong>{(ds.record_count || 0).toLocaleString()}</strong></td>
                    <td>
                      <span className="badge badge-success">
                        {ds.verification_status || ds.verification_level || 'VERIFIED'}
                      </span>
                    </td>
                    <td>{ds.provider || 'OpenStreetMap & Madurai Corporation'}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>
                        ACTIVE GIS DATASET
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
