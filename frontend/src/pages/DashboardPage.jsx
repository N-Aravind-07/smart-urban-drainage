import React, { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/client'
import { Link } from 'react-router-dom'

function KPICard({ icon, value, label, sub, accent }) {
  return (
    <div className={`kpi-card${accent ? ` accent-${accent}` : ''}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-value">{value ?? '—'}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.summary().then(r => { setSummary(r.data); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="page-content">
      <div className="loading-state"><div className="spinner" /><span>Loading dashboard…</span></div>
    </div>
  )

  const s = summary || {}
  const plasticPct = s.total_incidents ? Math.round(s.plastic_incidents / s.total_incidents * 100) : 0

  return (
    <div className="page-content">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard icon="🌊" value={`${s.total_drain_length_km} km`} label="Total Drain Length" sub={`${s.total_drain_points} drain segments`} accent="blue" />
        <KPICard icon="🔴" value={s.total_incidents} label="Blockage Incidents" sub="2023 – 2025 (Demo)" />
        <KPICard icon="🛍️" value={s.plastic_incidents} label="Plastic-Related" sub={`${plasticPct}% of all incidents`} accent="red" />
        <KPICard icon="⚠️" value={s.high_risk_drains} label="High-Risk Drains" sub="Score > 60" accent="orange" />
        <KPICard icon="🔧" value={s.completed_cleanings} label="Cleaning Records" />
        <KPICard icon="📋" value={s.open_interventions} label="Open Interventions" accent="orange" />
        <KPICard icon="🗺️" value={s.wards_covered} label="Wards Covered" sub="Madurai Study Area" accent="blue" />
        <KPICard icon="✅" value={s.completed_cleanings} label="Interventions Done" accent="green" />
      </div>

      {/* Quick links */}
      <div className="grid-2 mb-4">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">🔥 Hotspot Summary</div>
              <div className="panel-subtitle">Drains with highest blockage frequency</div>
            </div>
            <Link to="/hotspots" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="panel-body">
            <p className="text-secondary text-sm">The drainage analysis identified <strong style={{color:'var(--risk-high)'}}>D027, D003, D004</strong> as the highest-risk segments, predominantly located in commercial and market land-use zones near Ward 1 (Goripalayam) and Ward 2 (Tallakulam).</p>
            <div style={{marginTop:12, display:'flex', gap:8}}>
              <span className="badge HIGH">3 HIGH</span>
              <span className="badge MEDIUM">7 MEDIUM</span>
              <span className="badge LOW">20 LOW</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">🌧️ Rainfall Association</div>
              <div className="panel-subtitle">Incidents by rainfall condition</div>
            </div>
            <Link to="/analytics" className="btn btn-secondary btn-sm">View Charts</Link>
          </div>
          <div className="panel-body">
            <p className="text-secondary text-sm">Heavy and very heavy rainfall conditions account for approximately <strong style={{color:'var(--accent-blue)'}}>55–60%</strong> of all recorded blockage incidents in the demo dataset, confirming the rainfall–blockage correlation.</p>
            <div style={{marginTop:12, display:'flex', gap:8}}>
              <span className="badge HIGH">Heavy rain ↑</span>
              <span className="badge MEDIUM">Monsoon peak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Research workflow */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">📚 Research Workflow</div>
          <div className="panel-subtitle">How this system supports your analysis</div>
        </div>
        <div className="panel-body">
          <div style={{display:'flex', gap:0, flexWrap:'wrap'}}>
            {[
              ['Historical Data', '/incidents', '📝'],
              ['Spatial Analysis', '/hotspots', '🗺️'],
              ['Temporal Analysis', '/analytics', '📈'],
              ['Plastic Analysis', '/analytics', '🛍️'],
              ['Rainfall Link', '/rainfall', '🌧️'],
              ['Hotspot ID', '/hotspots', '🔥'],
              ['Risk Scoring', '/risk', '⚠️'],
              ['Prioritization', '/interventions', '🔧'],
              ['Before/After', '/interventions', '📊'],
            ].map(([label, to, icon], i, arr) => (
              <React.Fragment key={label}>
                <Link to={to} style={{textDecoration:'none'}}>
                  <div style={{
                    background:'var(--bg-secondary)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-sm)', padding:'8px 12px',
                    fontSize:12, color:'var(--text-secondary)', cursor:'pointer',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    minWidth:80, textAlign:'center',
                    transition:'all var(--transition)',
                  }}
                    onMouseEnter={e => {e.currentTarget.style.borderColor='var(--accent-blue)'; e.currentTarget.style.color='var(--text-primary)'}}
                    onMouseLeave={e => {e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'}}
                  >
                    <span style={{fontSize:18}}>{icon}</span>
                    <span>{label}</span>
                  </div>
                </Link>
                {i < arr.length - 1 && <div style={{display:'flex', alignItems:'center', padding:'0 4px', color:'var(--text-muted)', fontSize:16}}>→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Data source notice */}
      <div style={{
        marginTop:16,
        padding:'12px 16px',
        background:'rgba(125,26,20,0.1)',
        border:'1px solid rgba(248,81,73,0.3)',
        borderRadius:'var(--radius)',
        fontSize:12,
        color:'var(--text-secondary)',
        lineHeight:1.6,
      }}>
        <strong style={{color:'var(--risk-high)'}}>⚠ DEMO MODE ACTIVE</strong> — All data displayed is synthetic (source = "DEMO/SIMULATED").
        Replace with official municipal records, IMD rainfall data, and field survey data before using for research or decisions.
        See <Link to="/data-sources">Data Sources</Link> for guidance on obtaining real data.
      </div>
    </div>
  )
}
