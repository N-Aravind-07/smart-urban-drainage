import React, { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap, LayersControl, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { drainAPI, incidentAPI, hotspotAPI, riskAPI } from '../api/client'

// Madurai centre
const CENTRE = [9.9252, 78.1198]
const ZOOM = 14

// Colours
const CONDITION_COLOR = { good:'#3fb950', fair:'#d29922', poor:'#f0883e', critical:'#f85149', unknown:'#8b949e' }
const SEVERITY_COLOR  = { low:'#3fb950', medium:'#d29922', high:'#f0883e', critical:'#f85149' }
const RISK_COLOR      = { HIGH:'#f85149', MEDIUM:'#f0883e', LOW:'#3fb950', NONE:'#8b949e' }
const RAIN_LABEL      = { none:'No Rain', light:'Light', moderate:'Moderate', heavy:'Heavy', very_heavy:'Very Heavy' }

function ResetView() {
  const map = useMap()
  return (
    <button
      title="Reset view to Madurai"
      onClick={() => map.setView(CENTRE, ZOOM)}
      style={{
        position:'absolute', top:80, right:10, zIndex:1000,
        background:'var(--bg-card)', border:'1px solid var(--border)',
        color:'var(--text-primary)', padding:'6px 10px', borderRadius:'var(--radius-sm)',
        cursor:'pointer', fontSize:12
      }}
    >🎯 Reset</button>
  )
}

export default function MapPage() {
  const [drainGeo, setDrainGeo] = useState(null)
  const [wardGeo, setWardGeo] = useState(null)
  const [incidentGeo, setIncidentGeo] = useState(null)
  const [hotspotGeo, setHotspotGeo] = useState(null)
  const [riskGeo, setRiskGeo] = useState(null)
  const [selected, setSelected] = useState(null)
  const [layers, setLayers] = useState({
    wards: true, drains: true, incidents: true, hotspots: false, risk: false
  })
  const [filters, setFilters] = useState({
    plastic: '', severity: '', rainfall: ''
  })

  useEffect(() => {
    drainAPI.getGeoJSON().then(r => setDrainGeo(r.data))
    drainAPI.getWardsGeoJSON().then(r => setWardGeo(r.data))
    hotspotAPI.getGeoJSON().then(r => setHotspotGeo(r.data))
    riskAPI.getGeoJSON().then(r => setRiskGeo(r.data))
  }, [])

  useEffect(() => {
    const params = {}
    if (filters.plastic !== '') params.plastic_present = filters.plastic === 'true'
    if (filters.severity) params.severity = filters.severity
    if (filters.rainfall) params.rainfall_condition = filters.rainfall
    incidentAPI.getGeoJSON(params).then(r => setIncidentGeo(r.data))
  }, [filters])

  const drainStyle = useCallback((feature) => ({
    color: CONDITION_COLOR[feature.properties.condition] || '#8b949e',
    weight: 3,
    opacity: 0.85,
  }), [])

  const hotspotStyle = useCallback((feature) => ({
    color: RISK_COLOR[feature.properties.hotspot_level] || '#8b949e',
    weight: 5,
    opacity: 0.7,
  }), [])

  const riskStyle = useCallback((feature) => ({
    color: RISK_COLOR[feature.properties.risk_level] || '#8b949e',
    weight: 4,
    opacity: 0.8,
    dashArray: '6 3',
  }), [])

  const wardStyle = { color: '#388bfd', weight: 1.5, opacity: 0.6, fillColor: '#388bfd', fillOpacity: 0.04 }

  return (
    <div className="map-page" style={{height:'100%'}}>
      {/* Left sidebar */}
      <div className="map-sidebar">
        {/* Layer toggles */}
        <div style={{padding:'12px 14px', borderBottom:'1px solid var(--border)'}}>
          <div className="panel-title mb-2">🗺️ Layers</div>
          {[
            ['wards', '🗺️', 'Ward Boundaries'],
            ['drains', '🌊', 'Drain Lines'],
            ['incidents', '🔴', 'Blockage Incidents'],
            ['hotspots', '🔥', 'Hotspot Layer'],
            ['risk', '⚠️', 'Risk Layer'],
          ].map(([key, icon, label]) => (
            <label key={key} style={{display:'flex', alignItems:'center', gap:8, padding:'5px 0', cursor:'pointer', fontSize:13, color:'var(--text-secondary)'}}>
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={e => setLayers(l => ({...l, [key]: e.target.checked}))}
                style={{accentColor:'var(--accent-blue)'}}
              />
              {icon} {label}
            </label>
          ))}
        </div>

        {/* Filters */}
        <div style={{padding:'12px 14px', borderBottom:'1px solid var(--border)'}}>
          <div className="panel-title mb-2">🔍 Incident Filters</div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <div className="form-group">
              <label className="form-label">Plastic Involved</label>
              <select className="form-select" value={filters.plastic} onChange={e => setFilters(f=>({...f,plastic:e.target.value}))}>
                <option value="">All</option>
                <option value="true">Yes (Plastic)</option>
                <option value="false">No Plastic</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select className="form-select" value={filters.severity} onChange={e => setFilters(f=>({...f,severity:e.target.value}))}>
                <option value="">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rainfall</label>
              <select className="form-select" value={filters.rainfall} onChange={e => setFilters(f=>({...f,rainfall:e.target.value}))}>
                <option value="">All</option>
                <option value="very_heavy">Very Heavy</option>
                <option value="heavy">Heavy</option>
                <option value="moderate">Moderate</option>
                <option value="light">Light</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{padding:'12px 14px', borderBottom:'1px solid var(--border)'}}>
          <div className="panel-title mb-2">🏷️ Legend</div>
          <div style={{fontSize:11, color:'var(--text-secondary)'}}>
            <div style={{marginBottom:8, fontWeight:600, color:'var(--text-primary)'}}>Drain Condition</div>
            {Object.entries(CONDITION_COLOR).map(([k, c]) => (
              <div key={k} className="legend-row">
                <div className="legend-line" style={{background:c}} />
                <span style={{textTransform:'capitalize'}}>{k}</span>
              </div>
            ))}
            <div style={{marginTop:10, marginBottom:6, fontWeight:600, color:'var(--text-primary)'}}>Incident Severity</div>
            {Object.entries(SEVERITY_COLOR).map(([k, c]) => (
              <div key={k} className="legend-row">
                <div className="legend-dot" style={{background:c}} />
                <span style={{textTransform:'capitalize'}}>{k}</span>
              </div>
            ))}
            <div style={{marginTop:10, marginBottom:6, fontWeight:600, color:'var(--text-primary)'}}>Risk Level</div>
            {['HIGH','MEDIUM','LOW'].map(r => (
              <div key={r} className="legend-row">
                <div className="legend-dot" style={{background:RISK_COLOR[r]}} />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected info */}
        {selected && (
          <div style={{padding:'12px 14px'}}>
            <div className="panel-title mb-2">ℹ️ Selected</div>
            <div className="info-panel" style={{padding:10}}>
              {Object.entries(selected).filter(([k]) => !['id','type'].includes(k)).map(([k, v]) => (
                <div className="info-row" key={k}>
                  <span className="info-key">{k.replace(/_/g,' ')}</span>
                  <span className="info-val">{String(v ?? '—')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="map-container" style={{position:'relative'}}>
        <MapContainer
          center={CENTRE}
          zoom={ZOOM}
          style={{width:'100%', height:'100%'}}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {/* Ward boundaries */}
          {layers.wards && wardGeo && (
            <GeoJSON data={wardGeo} style={() => wardStyle}
              onEachFeature={(feature, layer) => {
                layer.bindTooltip(feature.properties.name, {permanent:false, sticky:true, className:'leaflet-label'})
              }}
            />
          )}

          {/* Drain lines */}
          {layers.drains && drainGeo && (
            <GeoJSON data={drainGeo} style={drainStyle}
              onEachFeature={(feature, layer) => {
                const p = feature.properties
                layer.on('click', () => setSelected(p))
                layer.bindPopup(
                  `<div style="font-family:Inter,sans-serif;min-width:200px">
                    <div style="font-weight:700;margin-bottom:8px;font-size:14px">${p.drain_id}</div>
                    <div style="display:flex;flex-direction:column;gap:4px;font-size:12px">
                      <div><span style="color:#8b949e">Type:</span> ${p.drain_type}</div>
                      <div><span style="color:#8b949e">Condition:</span> <strong style="color:${CONDITION_COLOR[p.condition]}">${p.condition?.toUpperCase()}</strong></div>
                      <div><span style="color:#8b949e">Material:</span> ${p.material}</div>
                      <div><span style="color:#8b949e">Land use:</span> ${p.land_use}</div>
                      <div><span style="color:#8b949e">Source:</span> <em>${p.source}</em></div>
                    </div>
                  </div>`,
                  {maxWidth:280}
                )
              }}
            />
          )}

          {/* Hotspot layer */}
          {layers.hotspots && hotspotGeo && (
            <GeoJSON data={hotspotGeo} style={hotspotStyle}
              onEachFeature={(feature, layer) => {
                const p = feature.properties
                layer.bindPopup(
                  `<div style="font-family:Inter,sans-serif;font-size:12px">
                    <strong>${p.drain_id}</strong> — Hotspot: <strong style="color:${RISK_COLOR[p.hotspot_level]}">${p.hotspot_level}</strong><br/>
                    Total: ${p.total_incidents} | Plastic: ${p.plastic_incidents} | Heavy rain: ${p.heavy_rain_incidents}
                  </div>`
                )
              }}
            />
          )}

          {/* Risk layer */}
          {layers.risk && riskGeo && (
            <GeoJSON data={riskGeo} style={riskStyle}
              onEachFeature={(feature, layer) => {
                const p = feature.properties
                layer.bindPopup(
                  `<div style="font-family:Inter,sans-serif;font-size:12px">
                    <strong>${p.drain_id}</strong><br/>
                    Risk: <strong style="color:${RISK_COLOR[p.risk_level]}">${p.risk_level}</strong> (${p.total_score})<br/>
                    ${(p.reasons || []).map(r => `• ${r}`).join('<br/>')}
                  </div>`,
                  {maxWidth:280}
                )
              }}
            />
          )}

          {/* Incident markers */}
          {layers.incidents && incidentGeo && incidentGeo.features?.map(f => {
            const p = f.properties
            const [lng, lat] = f.geometry.coordinates
            const color = p.plastic_present ? '#f85149' : (p.blockage_type === 'silt' ? '#8b949e' : '#f0883e')
            return (
              <CircleMarker
                key={p.incident_id}
                center={[lat, lng]}
                radius={p.severity === 'critical' ? 9 : p.severity === 'high' ? 7 : 5}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1.5 }}
              >
                <Popup maxWidth={300}>
                  <div style={{fontFamily:'Inter,sans-serif',fontSize:12,minWidth:220}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>{p.incident_id}</div>
                    <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'3px 12px'}}>
                      <span style={{color:'#8b949e'}}>Drain:</span><strong>{p.drain_id || '—'}</strong>
                      <span style={{color:'#8b949e'}}>Date:</span><span>{p.incident_date}</span>
                      <span style={{color:'#8b949e'}}>Time:</span><span>{p.incident_time || 'Not recorded'}</span>
                      <span style={{color:'#8b949e'}}>Plastic:</span><strong style={{color: p.plastic_present ? '#f85149' : '#3fb950'}}>{p.plastic_present ? `Yes (${p.plastic_type || 'unknown'})` : 'No'}</strong>
                      <span style={{color:'#8b949e'}}>Severity:</span><strong style={{color:SEVERITY_COLOR[p.severity]}}>{p.severity?.toUpperCase()}</strong>
                      <span style={{color:'#8b949e'}}>Rainfall:</span><span>{RAIN_LABEL[p.rainfall_condition] || p.rainfall_condition}</span>
                      <span style={{color:'#8b949e'}}>Waterlog:</span><span>{p.waterlogging ? '🌊 Yes' : 'No'}</span>
                      <span style={{color:'#8b949e'}}>Source:</span><em style={{color:'#fca5a5'}}>{p.source}</em>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          <ResetView />
        </MapContainer>

        {/* Map attribution note */}
        <div style={{
          position:'absolute', bottom:24, left:10, zIndex:1000,
          background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:10,
          color:'var(--text-muted)',
        }}>
          🗺️ Basemap: OpenStreetMap (ODbL) · Drainage network: Real OSM Madurai Waterways (187 Channels)
        </div>
      </div>
    </div>
  )
}
