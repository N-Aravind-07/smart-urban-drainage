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
import { MADURAI_RAINFALL_CORRELATION, MADURAI_RAINFALL_DAILY } from '../data/maduraiData'
import Pagination from '../components/common/Pagination'

export default function RainfallPage() {
  const [rainfallData, setRainfallData] = useState([])
  const [correlationData, setCorrelationData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pagination for daily records
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
      const rData = rainRes.data?.length ? rainRes.data : MADURAI_RAINFALL_DAILY
      const cData = corrRes.data?.length ? corrRes.data : MADURAI_RAINFALL_CORRELATION
      setRainfallData(rData)
      setCorrelationData(cData.map(c => ({
        month: c.month,
        total_rainfall_mm: c.total_rainfall_mm ?? c.precipitation_mm ?? c.rainfall_mm ?? 0,
        incidents_count: c.incidents_count ?? c.blockage_count ?? c.count ?? 0
      })))
    } catch (err) {
      console.error(err)
      setRainfallData(MADURAI_RAINFALL_DAILY)
      setCorrelationData(MADURAI_RAINFALL_CORRELATION.map(c => ({
        month: c.month,
        total_rainfall_mm: c.precipitation_mm,
        incidents_count: c.blockage_count
      })))
    } finally {
      setLoading(false)
    }
  }

  const heavyRainDays = rainfallData.filter(r => (r.rainfall_mm || 0) >= 35)
  const totalRainfall = rainfallData.reduce((acc, curr) => acc + (curr.rainfall_mm || 0), 0)
  const maxRainfall = rainfallData.length > 0 ? Math.max(...rainfallData.map(r => r.rainfall_mm || 0)).toFixed(1) : '0'

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    color: '#0f172a',
    fontSize: '12px',
    fontWeight: 500,
  }

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div className="page-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🌧️ Rainfall & Storm Water Impact</h1>
          <p className="page-subtitle">
            Historical rainfall observations, monsoon spikes, and blockage triggers in Madurai
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>🔄 Refresh Data</button>
      </div>

      <div className="stats-grid mb-4">
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
          <div className="stat-value text-danger">{maxRainfall} mm</div>
          <div className="stat-desc">Peak monsoon intensity event</div>
        </div>
      </div>

      {/* Chart: Rainfall vs Blockage Incidents */}
      <div className="card mb-4" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Monthly Rainfall vs. Blockage Frequency Correlation</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
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
          <div style={{ width: '100%', height: 360, minHeight: 360 }}>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={correlationData} margin={{ top: 15, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px', fontWeight: 600 }} />
                <YAxis yAxisId="left" stroke="#2563eb" label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', fill: '#2563eb', style: { fontSize: '11px', fontWeight: 600 } }} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" label={{ value: 'Incidents Count', angle: 90, position: 'insideRight', fill: '#ef4444', style: { fontSize: '11px', fontWeight: 600 } }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="total_rainfall_mm" name="Monthly Rainfall (mm)" fill="#2563eb" radius={[6, 6, 0, 0]} opacity={0.85} />
                <Line yAxisId="right" type="monotone" dataKey="incidents_count" name="Blockage Incidents" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: '#ef4444' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Rainfall Records Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Recent Rainfall Daily Log ({rainfallData.length})</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Page {currentPage} of {Math.max(1, Math.ceil(rainfallData.length / pageSize))}</span>
          </div>
          <span className="badge badge-info">Madurai IMD / Weather Station Data</span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading rainfall records...</div>
        ) : (
          <div>
            <div className="table-responsive-container">
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
                  {rainfallData
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((r, idx) => {
                      const mm = r.rainfall_mm || 0
                      return (
                        <tr key={r.id || idx}>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{r.date || r.record_date}</td>
                          <td style={{ fontWeight: 500 }}>{r.station || r.station_name || 'Madurai South IMD (Tallakulam)'}</td>
                          <td style={{ fontWeight: 700, color: mm > 40 ? 'var(--cond-critical)' : mm > 15 ? 'var(--cond-fair)' : 'var(--cond-good)' }}>
                            {mm} mm
                          </td>
                          <td>
                            <span className={`badge ${
                              mm > 50 ? 'badge-danger' :
                              mm > 25 ? 'badge-warning' :
                              mm > 5 ? 'badge-info' : 'badge-success'
                            }`}>
                              {mm > 50 ? 'EXTREME HEAVY' :
                               mm > 25 ? 'HEAVY RAIN' :
                               mm > 5 ? 'MODERATE' : 'LIGHT / DRY'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ fontSize: '10px' }}>
                              {r.source || 'IMD_AUTOMATIC_WEATHER_STATION'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={rainfallData.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  )
}
