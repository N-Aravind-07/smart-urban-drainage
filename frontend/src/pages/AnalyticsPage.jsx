import React, { useState, useEffect } from 'react'
import { analyticsAPI } from '../api/client'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4']

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [monthlyData, setMonthlyData] = useState([])
  const [plasticData, setPlasticData] = useState([])
  const [severityData, setSeverityData] = useState([])
  const [topDrains, setTopDrains] = useState([])
  const [timeOfDay, setTimeOfDay] = useState({ data: [], records_with_time: 0, records_without_time: 0 })
  const [wardData, setWardData] = useState([])

  useEffect(() => {
    fetchAllAnalytics()
  }, [])

  const fetchAllAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const [mRes, pRes, sRes, tRes, todRes, wRes] = await Promise.all([
        analyticsAPI.monthly(),
        analyticsAPI.plastic(),
        analyticsAPI.severity(),
        analyticsAPI.topDrains(10),
        analyticsAPI.timeOfDay(),
        analyticsAPI.wardBreakdown()
      ])

      // 1. Monthly trend
      setMonthlyData(Array.isArray(mRes.data) ? mRes.data : [])

      // 2. Plastic composition
      if (pRes.data && pRes.data.plastic_types) {
        const list = pRes.data.plastic_types.map(pt => ({
          name: pt.type.toUpperCase().replace(/_/g, ' '),
          count: pt.count
        }))
        if (pRes.data.non_plastic > 0) {
          list.push({ name: 'NON PLASTIC / SILT', count: pRes.data.non_plastic })
        }
        setPlasticData(list)
      } else {
        setPlasticData([])
      }

      // 3. Severity
      if (Array.isArray(sRes.data)) {
        setSeverityData(sRes.data.map(s => ({
          severity: s.severity.toUpperCase(),
          count: s.count
        })))
      } else {
        setSeverityData([])
      }

      // 4. Top Drains
      if (Array.isArray(tRes.data)) {
        setTopDrains(tRes.data.map(d => ({
          drain_code: d.drain_id || d.drain_code,
          total: d.total || d.incident_count || 0
        })))
      } else {
        setTopDrains([])
      }

      // 5. Time of Day
      if (todRes.data) {
        setTimeOfDay({
          data: todRes.data.data || [],
          records_with_time: todRes.data.records_with_time || 0,
          records_without_time: todRes.data.records_without_time || 0
        })
      }

      // 6. Ward Breakdown
      if (Array.isArray(wRes.data)) {
        setWardData(wRes.data.map(w => ({
          ward_name: `Ward ${w.ward_id}`,
          total: w.total || 0,
          plastic: w.plastic || 0
        })))
      } else {
        setWardData([])
      }

    } catch (err) {
      console.error(err)
      setError('Failed to load analytical metrics.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div className="page-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">📈 Statistical Analytics & Temporal Insights</h1>
          <p className="page-subtitle">
            Municipal drainage blockage metrics, plastic composition & ward comparisons across Madurai
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAllAnalytics}>🔄 Refresh Charts</button>
      </div>

      {loading ? (
        <div className="loading-spinner">Aggregating municipal blockage statistics...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Chart 1: Monthly Blockage Trend */}
          <div className="card">
            <div style={{ marginBottom: '12px' }}>
              <h3>Monthly Blockage Incidents Trend</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Incident counts per month across Madurai</p>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                  <Line type="monotone" dataKey="total" name="Total Incidents" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="plastic" name="Plastic Incidents" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Plastic Debris Types */}
          <div className="card">
            <div style={{ marginBottom: '12px' }}>
              <h3>Plastic Waste Composition</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Proportion of single-use bags, bottles & packaging</p>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={plasticData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {plasticData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Top Blocked Channels */}
          <div className="card">
            <div style={{ marginBottom: '12px' }}>
              <h3>Top Blocked Drain Segments</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Drain channels with highest blockage frequency</p>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={topDrains} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#64748b" style={{ fontSize: '11px' }} />
                  <YAxis dataKey="drain_code" type="category" stroke="#64748b" style={{ fontSize: '10px' }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                  <Bar dataKey="total" name="Incidents" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Hourly Distribution */}
          <div className="card">
            <div style={{ marginBottom: '12px' }}>
              <h3>Blockage Reports by Time Window</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily hourly distribution of reported obstructions</p>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={timeOfDay.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="slot" stroke="#64748b" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                  <Bar dataKey="count" name="Reports" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Ward Breakdown */}
          <div className="card">
            <div style={{ marginBottom: '12px' }}>
              <h3>Ward Incidents Comparison</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Blockages per Madurai Corporation Ward</p>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={wardData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="ward_name" stroke="#64748b" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                  <Bar dataKey="total" name="Total Incidents" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="plastic" name="Plastic Incidents" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Severity Distribution */}
          <div className="card">
            <div style={{ marginBottom: '12px' }}>
              <h3>Incident Severity Levels</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Breakdown of Medium, High & Critical events</p>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    label={({ severity, percent }) => `${severity} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
