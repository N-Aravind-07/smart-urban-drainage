import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: '📊', label: 'Dashboard' },
      { to: '/map', icon: '🗺️', label: 'GIS Map' },
    ],
  },
  {
    label: 'Network & Data',
    items: [
      { to: '/drainage-network', icon: '🌊', label: 'Drainage Network' },
      { to: '/incidents', icon: '🔴', label: 'Blockage Incidents' },
      { to: '/rainfall', icon: '🌧️', label: 'Rainfall Analysis' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { to: '/hotspots', icon: '🔥', label: 'Hotspot Analysis' },
      { to: '/risk', icon: '⚠️', label: 'Risk Analysis' },
      { to: '/analytics', icon: '📈', label: 'Analytics' },
      { to: '/ml', icon: '🤖', label: 'ML Prediction' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/interventions', icon: '🔧', label: 'Interventions' },
      { to: '/reports', icon: '📋', label: 'Reports' },
    ],
  },
  {
    label: 'Data Management',
    items: [
      { to: '/import', icon: '📤', label: 'Data Import' },
      { to: '/data-sources', icon: '🗄️', label: 'Data Sources' },
      { to: '/users', icon: '👥', label: 'Users' },
      { to: '/settings', icon: '⚙️', label: 'Settings' },
    ],
  },
]

export default function Sidebar() {
  const { role, setRole } = useRole()

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🌊</div>
        <div>
          <div className="logo-text">Smart Drainage</div>
          <div className="logo-sub">Madurai Study Area</div>
        </div>
      </div>

      {/* Nav sections */}
      {NAV_SECTIONS.map((section) => (
        <div className="sidebar-section" key={section.label}>
          <div className="sidebar-section-label">{section.label}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      {/* Role selector */}
      <div className="sidebar-role-selector">
        <label htmlFor="role-select">Active Role</label>
        <select
          id="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Switch user role"
        >
          <option value="admin">🔑 Admin</option>
          <option value="officer">🏛️ Municipal Officer</option>
          <option value="field_worker">🦺 Field Worker</option>
        </select>
      </div>
    </aside>
  )
}
