import React, { useState, useEffect } from 'react'
import { rainfallAPI, analyticsAPI } from '../api/client'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

export default function RainfallPage() {
  const [rainfallData, setRainfallData] = useState([])
  const [correlationData, setCorrelationData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [rainRes, corrRes] = await Promise.all([
        rainfallAPI.getAll({ limit: 100 }),
        analyticsAPI.rainfall()
      ])
      setRainfallData(rainRes.data || [])
      setCorrelationData(corrRes.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to fetch rainfall analysis data.')
    } finally {
      setLoading(false)
    }
  }

  const heavyRainDays = rainfallData.filter(r => r.rainfall_mm >= 35)
  const totalRainfall = rainfallData.reduce((acc, curr) => acc + (curr.rainfall_mm || 0), 0)

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🌧️ Rainfall & Storm Water Impact</h1>
          <p className="page-subtitle">
            Historical rainfall observations, monsoon spikes, and blockage triggers in Madurai
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>🔄 Refresh Data</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Recorded Days</div>
          <div className="stat-value text-accent">{rainfallData.length}</div>
          <div className="stat-desc">Daily station observations</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Precipitation</div>
          <div className="stat-value text-info">{totalRainfall.toFixed(1)} mm</div>
          <div className="stat-desc">Cumulative rainfall recorded</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Heavy Rain Days (&gt;35mm)</div>
          <div className="stat-value text-warning">{heavyRainDays.length}</div>
          <div className="stat-desc">High risk for plastic overflow</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Max 24h Rainfall</div>
          <div className="stat-value text-danger">
            {rainfallData.length > 0 ? `${Math.max(...rainfallData.map(r => r.rainfall_mm)).toFixed(1)} mm` : '0 mm'}
          </div>
          <div className="stat-desc">Peak monsoon intensity event</div>
        </div>
      </div>

      {/* Chart: Rainfall vs Blockage Incidents */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3>Monthly Rainfall vs. Blockage Frequency Correlation</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Analyzes how monsoon rainfall surges correlate with plastic accumulation and blockage reports
            </p>
          </div>
          <span className="badge badge-info">IMD WEATHER OBSERVATION NETWORK</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading correlation model...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <ComposedChart data={correlationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="left" stroke="#3b82f6" label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', fill: '#3b82f6', style: { fontSize: '11px' } }} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" label={{ value: 'Incidents Count', angle: 90, position: 'insideRight', fill: '#ef4444', style: { fontSize: '11px' } }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="total_rainfall_mm" name="Monthly Rainfall (mm)" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Line yAxisId="right" type="monotone" dataKey="incidents_count" name="Blockage Incidents" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Rainfall Records Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Recent Rainfall Daily Log</h3>
          <span className="badge badge-info">Madurai IMD / Weather Station Data</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading rainfall records...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Station / Location</th>
                  <th>Rainfall (mm)</th>
                  <th>Intensity Category</th>
                  <th>Data Source</th>
                </tr>
              </thead>
              <tbody>
                {rainfallData.slice(0, 25).map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.record_date}</td>
                    <td>{r.station_name || 'Madurai Central'}</td>
                    <td style={{ fontWeight: 600, color: r.rainfall_mm > 40 ? 'var(--accent-danger)' : r.rainfall_mm > 15 ? 'var(--accent-warning)' : 'var(--accent-primary)' }}>
                      {r.rainfall_mm} mm
                    </td>
                    <td>
                      <span className={`badge ${
                        r.rainfall_mm > 50 ? 'badge-danger' :
                        r.rainfall_mm > 25 ? 'badge-warning' :
                        r.rainfall_mm > 5 ? 'badge-info' : 'badge-success'
                      }`}>
                        {r.rainfall_mm > 50 ? 'EXTREME HEAVY' :
                         r.rainfall_mm > 25 ? 'HEAVY RAIN' :
                         r.rainfall_mm > 5 ? 'MODERATE' : 'LIGHT / DRY'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>
                        {r.source || 'IMD_STATION'}
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
