import React from 'react'

export default function DemoBanner() {
  return (
    <div className="demo-banner" role="status" style={{
      background: 'linear-gradient(90deg, #0f172a, #1e293b, #0f172a)',
      color: 'var(--text-primary)',
      fontSize: '12px',
      fontWeight: '600',
      padding: '6px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      borderBottom: '1px solid var(--border)'
    }}>
      <span style={{ color: 'var(--accent-blue)', fontSize: '13px' }}>🌐</span>
      <span>
        <strong>MADURAI MUNICIPAL CORPORATION</strong> &nbsp;|&nbsp; Smart Urban Drainage GIS & Plastic Blockage Analysis Platform &nbsp;|&nbsp; <em>Madurai Corporation Study Area</em>
      </span>
      <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '10px' }}>
        ● LIVE GIS NETWORK
      </span>
    </div>
  )
}
