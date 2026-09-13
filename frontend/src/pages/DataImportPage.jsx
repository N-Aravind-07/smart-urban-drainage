import React, { useState } from 'react'
import { importAPI } from '../api/client'

export default function DataImportPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setResult(null)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await importAPI.uploadIncidents(formData)
      setResult(res.data)
    } catch (err) {
      console.error(err)
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Failed to process CSV file. Ensure correct format and columns.')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">📤 Batch Data Import & CSV Parser</h1>
          <p className="page-subtitle">
            Upload municipal blockage records, field observations or rainfall CSV callsets with validation
          </p>
        </div>
        <a
          href="http://localhost:8000/api/import/template/incidents"
          download
          className="btn btn-secondary"
        >
          📥 Download CSV Template
        </a>
      </div>

      {/* Upload Drag & Drop Card */}
      <div className="card mb-4">
        <h3 style={{ marginBottom: '16px' }}>Upload Blockage Incidents CSV</h3>

        <form onSubmit={handleUpload}>
          <div style={{
            border: '2px dashed var(--accent-primary)',
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#0f172a',
            marginBottom: '16px',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>
              {file ? file.name : 'Select or Drag & Drop Incident CSV File'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Supports UTF-8 CSV files up to 10MB
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'block', margin: '16px auto 0 auto' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!file || uploading}
            >
              {uploading ? 'Processing CSV Records...' : '📤 Upload & Validate Dataset'}
            </button>
          </div>
        </form>
      </div>

      {/* Result Status */}
      {result && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--accent-success)' }}>
          <h3 className="text-success" style={{ marginBottom: '8px' }}>
            ✅ Batch Import Completed Successfully
          </h3>
          <p>
            Successfully imported <strong>{result.inserted_count || result.records_processed || 0} records</strong> into database with <code>source="FIELD_IMPORT"</code> tag.
          </p>
          {result.errors && result.errors.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <h4>Validation Warnings ({result.errors.length}):</h4>
              <ul style={{ fontSize: '12px', color: 'var(--accent-warning)' }}>
                {result.errors.map((err, idx) => (
                  <li key={idx}>Row {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">
          <strong>Import Error:</strong> {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}

      {/* Required CSV Schema Reference */}
      <div className="card">
        <h3>CSV Format Requirements & Columns Schema</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Your CSV file must include the following header row columns:
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Type</th>
                <th>Required</th>
                <th>Valid Options / Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>drain_code</td>
                <td>String</td>
                <td><span className="badge badge-danger">YES</span></td>
                <td><code>DRAIN-GOR-001</code>, <code>DRAIN-TAL-002</code></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>incident_date</td>
                <td>Date (YYYY-MM-DD)</td>
                <td><span className="badge badge-danger">YES</span></td>
                <td><code>2026-08-15</code></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>severity</td>
                <td>Enum String</td>
                <td>No</td>
                <td><code>LOW</code>, <code>MEDIUM</code>, <code>HIGH</code>, <code>CRITICAL</code></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>blockage_cause</td>
                <td>String</td>
                <td>No</td>
                <td><code>PLASTIC_ACCUMULATION</code>, <code>SILT</code></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>plastic_density</td>
                <td>Enum String</td>
                <td>No</td>
                <td><code>LOW</code>, <code>MEDIUM</code>, <code>HIGH</code></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>plastic_type</td>
                <td>Enum String</td>
                <td>No</td>
                <td><code>SINGLE_USE_BAGS</code>, <code>PET_BOTTLES</code>, <code>PACKAGING_WRAP</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
