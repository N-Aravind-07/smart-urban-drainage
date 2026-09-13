import React from 'react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/': { title: 'Dashboard', sub: 'Overview of drainage network and blockage statistics' },
  '/map': { title: 'GIS Map', sub: 'Interactive drainage network map — Madurai Study Area' },
  '/drainage-network': { title: 'Drainage Network', sub: 'Drainage segments, junctions, and outlets' },
  '/incidents': { title: 'Blockage Incidents', sub: 'Historical blockage incident records' },
  '/rainfall': { title: 'Rainfall Analysis', sub: 'Rainfall patterns and blockage correlation' },
  '/hotspots': { title: 'Hotspot Analysis', sub: 'Spatial clustering of recurring blockage locations' },
  '/risk': { title: 'Risk Analysis', sub: 'Transparent risk scoring per drainage segment' },
  '/analytics': { title: 'Analytics', sub: 'Temporal and statistical blockage analysis' },
  '/ml': { title: 'ML Prediction', sub: 'Machine learning risk prediction module' },
  '/interventions': { title: 'Interventions', sub: 'Municipal action tracking and before/after evaluation' },
  '/reports': { title: 'Reports', sub: 'Generate summary reports for selected ward/period' },
  '/import': { title: 'Data Import', sub: 'Upload CSV records — drains, incidents, rainfall, cleaning' },
  '/data-sources': { title: 'Data Sources', sub: 'Provenance and verification status of all datasets' },
  '/users': { title: 'Users', sub: 'System user management' },
  '/settings': { title: 'Settings', sub: 'Configure risk weights and system parameters' },
}

export default function TopBar() {
  const { pathname } = useLocation()
  const info = PAGE_TITLES[pathname] || { title: 'Smart Drainage', sub: '' }

  return (
    <header className="topbar" role="banner">
      <div style={{ flex: 1 }}>
        <div className="topbar-title">{info.title}</div>
        <div className="topbar-subtitle">{info.sub}</div>
      </div>
      <span className="badge demo">⚠ DEMO DATA</span>
    </header>
  )
}
