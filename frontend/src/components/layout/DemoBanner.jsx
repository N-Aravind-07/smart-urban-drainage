import React from 'react'

export default function DemoBanner() {
  return (
    <div className="municipal-ribbon" role="status" style={{
      background: 'linear-gradient(90deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)',
      color: '#1e293b',
      fontSize: '12px',
      fontWeight: '600',
      padding: '7px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <span style={{ color: 'var(--accent-blue)', fontSize: '14px' }}>🌐</span>
      <span style={{ letterSpacing: '0.01em' }}>
        <strong style={{ color: '#1d4ed8' }}>MADURAI MUNICIPAL CORPORATION</strong> &nbsp;|&nbsp; Smart Urban Drainage GIS & Plastic Blockage Analysis Platform &nbsp;|&nbsp; <em>Madurai Corporation Study Area</em>
      </span>
      <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '10px', padding: '3px 8px' }}>
        ● LIVE GIS NETWORK
      </span>
    </div>
  )
}
