import React, { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { drainAPI, incidentAPI, hotspotAPI, riskAPI } from '../api/client'

// Madurai Center coordinates
const CENTRE = [9.9252, 78.1198]
const ZOOM = 13

// 100% Free, High-Speed Open Basemaps with Zero API Keys and Zero Watermarks
const BASEMAPS = {
  osm: {
    name: '🗺️ OpenStreetMap (Real Street Network)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19
  },
  satellite: {
    name: '🛰️ Satellite Aerial Imagery (Esri World)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; High-Resolution Satellite',
    maxZoom: 19,
    maxNativeZoom: 17
  },
  topo: {
    name: '🏔️ Topographic & Hydrography (OpenTopoMap)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap, SRTM | Style: OpenTopoMap',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 17
  }
}

// Visual Palette
const CONDITION_COLOR = {
  GOOD: '#16a34a',
  FAIR: '#d97706',
  POOR: '#ea580c',
  CRITICAL: '#dc2626',
  good: '#16a34a',
  fair: '#d97706',
  poor: '#ea580c',
  critical: '#dc2626',
  unknown: '#64748b'
}

const SEVERITY_COLOR = {
  low: '#16a34a',
  LOW: '#16a34a',
  medium: '#d97706',
  MEDIUM: '#d97706',
  high: '#ea580c',
  HIGH: '#ea580c',
  critical: '#dc2626',
  CRITICAL: '#dc2626'
}

// Controller to guarantee instant sizing and eliminate grey tile gaps
function MapController() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    const t1 = setTimeout(() => map.invalidateSize(), 150)
    const t2 = setTimeout(() => map.invalidateSize(), 500)
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('resize', handleResize)
    }
  }, [map])
  return null
}

// Map Controls: Fit to Drains & Madurai Center
function MapActions({ drainGeo }) {
  const map = useMap()

  const fitAllDrains = () => {
    if (drainGeo && drainGeo.features && drainGeo.features.length > 0) {
      try {
        const coords = []
        drainGeo.features.forEach(f => {
          if (f.geometry?.type === 'LineString') {
            f.geometry.coordinates.forEach(c => coords.push([c[1], c[0]]))
          } else if (f.geometry?.type === 'Point') {
            coords.push([f.geometry.coordinates[1], f.geometry.coordinates[0]])
          }
        })
        if (coords.length > 0) {
          map.fitBounds(coords, { padding: [40, 40], maxZoom: 15, animate: true })
        }
      } catch (e) {
        map.setView(CENTRE, ZOOM, { animate: true })
      }
    } else {
      map.setView(CENTRE, ZOOM, { animate: true })
    }
  }

  return (
    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        title="Fit entire drainage waterways network in view"
        onClick={fitAllDrains}
        style={{
          background: '#ffffff', border: '1px solid #cbd5e1',
          color: '#1e40af', padding: '8px 14px', borderRadius: '8px',
          cursor: 'pointer', fontSize: 12, fontWeight: 700,
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s'
        }}
      >
        <span>🌊</span> Fit All Drains
      </button>
      <button
        title="Reset view to Central Madurai"
        onClick={() => map.setView(CENTRE, ZOOM, { animate: true })}
        style={{
          background: '#ffffff', border: '1px solid #cbd5e1',
          color: '#0f172a', padding: '8px 14px', borderRadius: '8px',
          cursor: 'pointer', fontSize: 12, fontWeight: 600,
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s'
        }}
      >
        <span>🎯</span> Madurai Center
      </button>
    </div>
  )
}

export default function MapPage() {
  const [drainGeo, setDrainGeo] = useState(null)
  const [wardGeo, setWardGeo] = useState(null)
  const [incidentGeo, setIncidentGeo] = useState(null)
  const [hotspotGeo, setHotspotGeo] = useState(null)
  const [riskGeo, setRiskGeo] = useState(null)
  const [selected, setSelected] = useState(null)
  
  // Basemap switcher state (Free, real maps with zero API key & zero watermark)
  const [activeBasemap, setActiveBasemap] = useState('osm')

  // Date filtering state
  const [selectedDate, setSelectedDate] = useState('ALL')

  const [layers, setLayers] = useState({
    wards: true,
    drains: true,
    incidents: true,
    hotspots: true,
    risk: false
  })

  const [filters, setFilters] = useState({
    plastic: '',
    severity: '',
    rainfall: ''
  })

  // Load static GIS layers
  useEffect(() => {
    drainAPI.getGeoJSON().then(r => setDrainGeo(r.data))
    drainAPI.getWardsGeoJSON().then(r => setWardGeo(r.data))
    hotspotAPI.getGeoJSON().then(r => setHotspotGeo(r.data))
    riskAPI.getGeoJSON().then(r => setRiskGeo(r.data))
  }, [])

  // Load filtered incidents by Date, Plastic, Severity, and Rainfall
  useEffect(() => {
    const params = {}
    if (filters.plastic !== '') params.plastic_present = filters.plastic === 'true'
    if (filters.severity) params.severity = filters.severity
    if (filters.rainfall) params.rainfall_condition = filters.rainfall
    
    if (selectedDate === 'LATE') {
      params.date_from = '2026-08-25'
      params.date_to = '2026-08-30'
    } else if (selectedDate === 'MID') {
      params.date_from = '2026-08-18'
      params.date_to = '2026-08-24'
    } else if (selectedDate === 'EARLY') {
      params.date_from = '2026-08-01'
      params.date_to = '2026-08-17'
    } else if (selectedDate !== 'ALL') {
      params.date = selectedDate
    }

    incidentAPI.getGeoJSON(params).then(r => setIncidentGeo(r.data))
  }, [filters, selectedDate])

  const drainStyle = useCallback((feature) => {
    const cond = (feature.properties.condition || 'good').toUpperCase()
    return {
      color: CONDITION_COLOR[cond] || '#2563eb',
      weight: 5,
      opacity: 0.94,
    }
  }, [])

  // Count active incidents on map
  const activeIncidentCount = incidentGeo?.features?.length || 0
  const activeDrainCount = drainGeo?.features?.length || 0

  return (
    <div className="map-page" style={{ height: 'calc(100vh - var(--topbar-height) - 37px)', minHeight: '600px', width: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <div className="map-sidebar" style={{ width: 320, minWidth: 320, maxWidth: 320, height: '100%', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
        
        {/* Basemap Selector */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#1e40af', marginBottom: '6px', letterSpacing: '0.04em' }}>
            🌍 Basemap (No API Key Required)
          </div>
          <select
            className="form-control"
            style={{ width: '100%', fontWeight: 600, fontSize: 13 }}
            value={activeBasemap}
            onChange={e => setActiveBasemap(e.target.value)}
          >
            <option value="osm">🗺️ OpenStreetMap (Real Street Network)</option>
            <option value="satellite">🛰️ Satellite Aerial Imagery (Esri)</option>
            <option value="topo">🏔️ Topographic & Hydrography</option>
          </select>
        </div>

        {/* Date Filter */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>
              📅 Filter by Incident Date
            </div>
            <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, padding: '2px 7px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
              {activeIncidentCount} Marked
            </span>
          </div>

          {/* Quick Date Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            <button
              onClick={() => setSelectedDate('ALL')}
              style={{
                padding: '6px 8px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                border: selectedDate === 'ALL' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: selectedDate === 'ALL' ? '#eff6ff' : '#f8fafc',
                color: selectedDate === 'ALL' ? '#1d4ed8' : '#475569'
              }}
            >
              All Aug 2026
            </button>
            <button
              onClick={() => setSelectedDate('LATE')}
              style={{
                padding: '6px 8px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                border: selectedDate === 'LATE' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: selectedDate === 'LATE' ? '#eff6ff' : '#f8fafc',
                color: selectedDate === 'LATE' ? '#1d4ed8' : '#475569'
              }}
            >
              Aug 25–30 (Peak)
            </button>
            <button
              onClick={() => setSelectedDate('MID')}
              style={{
                padding: '6px 8px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                border: selectedDate === 'MID' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: selectedDate === 'MID' ? '#eff6ff' : '#f8fafc',
                color: selectedDate === 'MID' ? '#1d4ed8' : '#475569'
              }}
            >
              Aug 18–24 (Showers)
            </button>
            <button
              onClick={() => setSelectedDate('EARLY')}
              style={{
                padding: '6px 8px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                border: selectedDate === 'EARLY' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: selectedDate === 'EARLY' ? '#eff6ff' : '#f8fafc',
                color: selectedDate === 'EARLY' ? '#1d4ed8' : '#475569'
              }}
            >
              Aug 01–17 (Baseline)
            </button>
          </div>

          {/* Specific Single Date Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
              Or Select Exact Observation Date:
            </label>
            <select
              className="form-control"
              style={{ width: '100%', fontSize: 12, fontWeight: 600 }}
              value={['ALL', 'LATE', 'MID', 'EARLY'].includes(selectedDate) ? '' : selectedDate}
              onChange={e => setSelectedDate(e.target.value || 'ALL')}
            >
              <option value="">-- Choose specific date --</option>
              <option value="2026-08-30">2026-08-30 (Thiruparankundram & Tallakulam Rain)</option>
              <option value="2026-08-29">2026-08-29 (Airport Station Rain - Koodal Nagar)</option>
              <option value="2026-08-28">2026-08-28 (Sellur Flash Flood Emergency)</option>
              <option value="2026-08-27">2026-08-27 (Simmakkal Market Runoff)</option>
              <option value="2026-08-25">2026-08-25 (Meenakshi Temple Perimeter Inflow)</option>
              <option value="2026-08-24">2026-08-24 (Goripalayam Storm Surge)</option>
              <option value="2026-08-22">2026-08-22 (Anuppanadi Canal Silt & Bags)</option>
              <option value="2026-08-20">2026-08-20 (Panagal Road Commercial Sump)</option>
              <option value="2026-08-19">2026-08-19 (Mattuthavani Outfall Debris)</option>
              <option value="2026-08-17">2026-08-17 (Villapuram Culvert Bottle Jam)</option>
              <option value="2026-08-16">2026-08-16 (Kiruthumal Basin Solid Waste)</option>
              <option value="2026-08-14">2026-08-14 (Pre-Monsoon Drainage Inspection)</option>
            </select>
          </div>
        </div>

        {/* Layer toggles */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
            🗺️ Active GIS Layers
          </div>
          {[
            ['drains', '🌊', `Drainage Channels (${activeDrainCount} Waterways)`],
            ['incidents', '🔴', `Blockage Incident Pins (${activeIncidentCount} active)`],
            ['wards', '🏛️', 'Ward Centers & Precincts'],
            ['hotspots', '🔥', 'Hotspot Hazard Sinks'],
            ['risk', '⚠️', 'Multi-Factor Risk Traces'],
          ].map(([key, icon, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={e => setLayers(l => ({ ...l, [key]: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: '#2563eb' }}
              />
              {icon} {label}
            </label>
          ))}
        </div>

        {/* Other Filters */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
            🔍 Incident Filters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Plastic Presence</label>
              <select className="form-control" style={{ width: '100%' }} value={filters.plastic} onChange={e => setFilters(f => ({ ...f, plastic: e.target.value }))}>
                <option value="">All Incidents</option>
                <option value="true">Plastic Debris Involved</option>
                <option value="false">Non-plastic Waste / Silt</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Severity Level</label>
              <select className="form-control" style={{ width: '100%' }} value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
                <option value="">All Severities</option>
                <option value="critical">Critical (Total Overflow)</option>
                <option value="high">High (Severe Flow Backup)</option>
                <option value="medium">Medium (Moderate Clog)</option>
                <option value="low">Low (Partial Flow)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Rainfall Condition</label>
              <select className="form-control" style={{ width: '100%' }} value={filters.rainfall} onChange={e => setFilters(f => ({ ...f, rainfall: e.target.value }))}>
                <option value="">All Weather Conditions</option>
                <option value="very_heavy">Very Heavy Downpour</option>
                <option value="heavy">Heavy Rain</option>
                <option value="moderate">Moderate Showers</option>
                <option value="light">Light Rain / Dry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            🏷️ Legend
          </div>
          <div style={{ fontSize: 12, color: '#334155' }}>
            <div style={{ marginBottom: 6, fontWeight: 700, fontSize: 11, color: '#0f172a' }}>CHANNEL CONDITION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 4, background: '#16a34a', borderRadius: 2 }} /> Good
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 4, background: '#d97706', borderRadius: 2 }} /> Fair
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 4, background: '#ea580c', borderRadius: 2 }} /> Poor
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 4, background: '#dc2626', borderRadius: 2 }} /> Critical
              </div>
            </div>

            <div style={{ marginBottom: 6, fontWeight: 700, fontSize: 11, color: '#0f172a' }}>INCIDENT SEVERITY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, background: '#dc2626', borderRadius: '50%' }} /> Critical
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, background: '#ea580c', borderRadius: '50%' }} /> High
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, background: '#d97706', borderRadius: '50%' }} /> Medium
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, background: '#16a34a', borderRadius: '50%' }} /> Low
              </div>
            </div>
          </div>
        </div>

        {/* Selected info card */}
        {selected && (
          <div style={{ padding: '14px 18px', background: '#f8fafc' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#1e40af' }}>ℹ️ Selected Channel</div>
            <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div><strong>Code:</strong> {selected.drain_code || selected.drain_id}</div>
              <div><strong>Name:</strong> {selected.name || 'Madurai Channel'}</div>
              <div><strong>Length:</strong> {selected.length_m || selected.length_meters || 0}m</div>
              <div><strong>Condition:</strong> <span style={{ fontWeight: 700, color: CONDITION_COLOR[selected.condition] }}>{selected.condition}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="map-container" style={{ flex: 1, position: 'relative', height: '100%' }}>
        <MapContainer
          center={CENTRE}
          zoom={ZOOM}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          {/* 100% Free Open Basemap with Zero API Key & Zero Watermark */}
          <TileLayer
            key={activeBasemap}
            url={BASEMAPS[activeBasemap].url}
            attribution={BASEMAPS[activeBasemap].attribution}
            subdomains={BASEMAPS[activeBasemap].subdomains || ['a', 'b', 'c']}
            maxZoom={BASEMAPS[activeBasemap].maxZoom}
            maxNativeZoom={BASEMAPS[activeBasemap].maxNativeZoom}
          />

          <MapController />
          <MapActions drainGeo={drainGeo} />

          {/* Ward Precinct Boundaries & Centers */}
          {layers.wards && wardGeo && (
            <GeoJSON
              key={`wards-${wardGeo.features?.length || 0}`}
              data={wardGeo}
              style={{
                color: '#2563eb',
                weight: 1.8,
                fillColor: '#3b82f6',
                fillOpacity: 0.08,
                dashArray: '5, 5'
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {}
                layer.bindTooltip(`🏛️ <b>${p.name || `Ward ${p.ward_id}`}</b>`, { sticky: true })
                layer.bindPopup(
                  `<div style="font-family:'Plus Jakarta Sans',sans-serif;padding:6px;min-width:180px">
                    <div style="font-weight:800;font-size:14px;color:#1d4ed8">${p.name || `Ward ${p.ward_id}`}</div>
                    <div style="font-size:12px;margin-top:6px;color:#334155">
                      <div><strong>Zone:</strong> ${p.zone || 'Madurai Corporation'}</div>
                      <div><strong>Area:</strong> ${p.area_sqkm || 'N/A'} sq.km</div>
                      <div><strong>Population:</strong> ${p.population ? p.population.toLocaleString() : 'N/A'}</div>
                    </div>
                  </div>`
                )
              }}
            />
          )}

          {/* Drainage Waterway Lines */}
          {layers.drains && drainGeo && (
            <GeoJSON
              key={`drains-${drainGeo.features?.length || 0}`}
              data={drainGeo}
              style={drainStyle}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {}
                layer.on('click', () => setSelected(p))
                const cond = (p.condition || 'good').toUpperCase()
                const name = p.name || p.drain_code || p.drain_id

                // Hover label
                layer.bindTooltip(
                  `<b>${name}</b> (${cond}) &bull; ${p.length_m || p.length_meters || 0}m`,
                  { sticky: true }
                )

                // Click Popup
                layer.bindPopup(
                  `<div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:240px;padding:4px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                      <span style="font-weight:800;font-size:14px;color:#1e40af">${p.drain_code || p.drain_id}</span>
                      <span style="background:${CONDITION_COLOR[cond]}22;color:${CONDITION_COLOR[cond]};font-weight:800;font-size:11px;padding:2px 8px;border-radius:12px;border:1px solid ${CONDITION_COLOR[cond]}55">${cond}</span>
                    </div>
                    <div style="font-weight:700;font-size:13px;margin-bottom:8px;color:#0f172a">${name}</div>
                    <div style="display:flex;flex-direction:column;gap:5px;font-size:12px;color:#334155">
                      <div><strong>Drain Type:</strong> ${p.drain_type || 'Culvert Canal'}</div>
                      <div><strong>Length:</strong> ${(p.length_m || p.length_meters || 0).toLocaleString()} meters</div>
                      <div><strong>Material:</strong> ${p.material || 'RCC Concrete Lining'}</div>
                      <div><strong>Plastic Load:</strong> <span style="color:#dc2626;font-weight:700">${p.plastic_debris_ratio || 75}%</span></div>
                      <div><strong>Ward:</strong> ${p.ward_name || `Ward ${p.ward_id}`}</div>
                    </div>
                  </div>`,
                  { maxWidth: 300 }
                )
              }}
            />
          )}

          {/* Hotspot Sinks */}
          {layers.hotspots && hotspotGeo && hotspotGeo.features?.map((f, idx) => {
            const p = f.properties || {}
            let lat = null, lng = null
            if (f.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates)) {
              lng = f.geometry.coordinates[0]
              lat = f.geometry.coordinates[1]
            } else if (p.latitude && p.longitude) {
              lat = p.latitude
              lng = p.longitude
            }
            if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null

            return (
              <CircleMarker
                key={`h-${idx}`}
                center={[lat, lng]}
                radius={11}
                pathOptions={{ color: '#ffffff', fillColor: '#dc2626', fillOpacity: 0.95, weight: 2.5 }}
              >
                <Tooltip sticky={true}>
                  🔥 {p.name || 'Hotspot'} ({p.vulnerability_tier || 'TIER 1'})
                </Tooltip>
                <Popup maxWidth={280}>
                  <div style={{ padding: '4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#dc2626' }}>🔥 {p.name || 'Hazard Sink'}</div>
                    <div style={{ fontSize: '12px', marginTop: 4 }}><strong>Vulnerability:</strong> {p.vulnerability_tier || 'High'}</div>
                    <div style={{ fontSize: '12px' }}><strong>Hotspot Score:</strong> {p.hotspot_score || 85}/100</div>
                    <div style={{ fontSize: '12px' }}><strong>Plastic Ratio:</strong> {p.plastic_ratio || 80}%</div>
                    {p.recommended_action && (
                      <div style={{ fontSize: '11px', marginTop: 6, color: '#475569' }}>{p.recommended_action}</div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          {/* Blockage Incidents (Filtered by Date, Severity, Plastic) */}
          {layers.incidents && incidentGeo && incidentGeo.features?.map((f, idx) => {
            const p = f.properties || {}
            let lat = null, lng = null
            if (f.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates)) {
              lng = f.geometry.coordinates[0]
              lat = f.geometry.coordinates[1]
            } else if (p.latitude && p.longitude) {
              lat = p.latitude
              lng = p.longitude
            }
            if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null

            const sev = (p.severity || 'medium').toUpperCase()
            const color = SEVERITY_COLOR[sev] || '#ea580c'
            return (
              <CircleMarker
                key={p.incident_id || idx}
                center={[lat, lng]}
                radius={sev === 'CRITICAL' ? 9 : sev === 'HIGH' ? 7 : 6}
                pathOptions={{ color: '#ffffff', fillColor: color, fillOpacity: 0.95, weight: 2.5 }}
              >
                <Tooltip sticky={true}>
                  <strong>{p.incident_id}</strong> &bull; {p.incident_date} ({sev})
                </Tooltip>
                <Popup maxWidth={300}>
                  <div style={{ padding: '6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: '#1e293b' }}>{p.incident_id}</span>
                      <span style={{ background: `${color}22`, color, fontWeight: 800, fontSize: '11px', padding: '2px 8px', borderRadius: '12px', border: `1px solid ${color}66` }}>
                        {sev}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#1e40af', marginBottom: 6 }}>
                      📍 {p.location_name || p.drain_code || 'Madurai Drain'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '12px', color: '#334155' }}>
                      <div><strong>📅 Incident Date:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{p.incident_date}</span> {p.incident_time && `at ${p.incident_time}`}</div>
                      <div><strong>🌊 Drain Code:</strong> {p.drain_code || p.drain_id}</div>
                      <div><strong>♻️ Plastic Waste:</strong> {p.plastic_present ? `Yes (${(p.plastic_type || 'Bags').replace(/_/g, ' ')})` : 'Non-plastic debris'}</div>
                      {p.estimated_quantity_kg && <div><strong>⚖️ Waste Quantity:</strong> ~{p.estimated_quantity_kg} kg</div>}
                      {p.water_overflow_cm > 0 && <div><strong>⚠️ Water Overflow:</strong> <span style={{ color: '#dc2626', fontWeight: 700 }}>{p.water_overflow_cm} cm</span></div>}
                      <div><strong>🌧️ Rainfall:</strong> {p.rainfall_condition ? p.rainfall_condition.replace(/_/g, ' ') : 'Moderate'}</div>
                    </div>

                    {p.remarks && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: 8, padding: '6px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                        📝 {p.remarks}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* Map attribution bar */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(6px)',
          border: '1px solid #cbd5e1', borderRadius: '6px',
          padding: '5px 14px', fontSize: '11px', color: '#334155', fontWeight: 600,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}>
          🗺️ Madurai Municipal Corporation GIS &bull; OpenStreetMap Real Basemap &bull; Zero API Key &bull; Live Hydrology Markings
        </div>
      </div>
    </div>
  )
}
