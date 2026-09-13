import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 2500, // 2.5s fast timeout to prevent blocking UI
})

export default api

// ── Endpoints ──────────────────────────────────────────────────────────────
export const drainAPI = {
  getAll: (params) => api.get('/drains', { params }),
  getById: (id) => api.get(`/drains/${id}`),
  getGeoJSON: () => api.get('/drains/geojson/all'),
  getWardsGeoJSON: () => api.get('/wards/geojson/all'),
  getWards: () => api.get('/wards'),
  getJunctions: (params) => api.get('/junctions', { params }),
}

export const incidentAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  getGeoJSON: (params) => api.get('/incidents/geojson', { params }),
  create: (data) => api.post('/incidents', data),
}

export const analyticsAPI = {
  summary: () => api.get('/analytics/summary'),
  monthly: () => api.get('/analytics/monthly-trend'),
  yearly: () => api.get('/analytics/yearly-trend'),
  plastic: () => api.get('/analytics/plastic-breakdown'),
  rainfall: () => api.get('/analytics/rainfall-blockage'),
  topDrains: (limit = 10) => api.get(`/analytics/top-drains?limit=${limit}`),
  timeOfDay: () => api.get('/analytics/time-of-day'),
  wardBreakdown: () => api.get('/analytics/ward-breakdown'),
  severity: () => api.get('/analytics/severity-distribution'),
}

export const riskAPI = {
  getAll: () => api.get('/risk/all-computed'),
  getDrain: (id) => api.get(`/risk/drain/${id}`),
  getGeoJSON: () => api.get('/risk/geojson'),
}

export const hotspotAPI = {
  getGeoJSON: () => api.get('/hotspots/geojson'),
  getHeatmap: () => api.get('/hotspots/heatmap'),
}

export const interventionAPI = {
  getAll: (params) => api.get('/interventions', { params }),
  getById: (id) => api.get(`/interventions/${id}`),
  create: (data) => api.post('/interventions', data),
  updateStatus: (id, status, notes) => api.patch(`/interventions/${id}/status`, { status, notes }),
  beforeAfter: (id) => api.get(`/interventions/${id}/before-after`),
}

export const rainfallAPI = {
  getAll: (params) => api.get('/rainfall', { params }),
}

export const cleaningAPI = {
  getAll: (params) => api.get('/cleaning', { params }),
}

export const mlAPI = {
  status: () => api.get('/ml/status'),
  predict: (drain_id) => api.get(`/ml/predict/${drain_id}`),
}

export const importAPI = {
  uploadIncidents: (formData) => api.post('/import/incidents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadTemplate: () => `${API_BASE}/import/template/incidents`,
}

export const datasourceAPI = {
  getAll: () => api.get('/datasources'),
}
