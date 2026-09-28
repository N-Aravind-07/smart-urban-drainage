import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const MADURAI_SLIDES = [
  {
    image: '/images/madurai_city_skyline.jpg',
    caption: 'Madurai City & Historic Meenakshi Temple Precinct',
    sub: 'Central urban drainage basin and historic temple ring channels',
  },
  {
    image: '/images/madurai_vaigai_river.jpg',
    caption: 'Vaigai River Basin & Urban Drainage Outfalls',
    sub: 'Primary river outfall trunk channels feeding Madurai South and North',
  },
]

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MADURAI_SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="home-portal" style={{ minHeight: '100%', position: 'relative', overflowX: 'hidden' }}>
      {/* Cinematic Hero Video/Photo Background with Ken Burns Pan Effect */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '520px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
      }}>
        {MADURAI_SLIDES.map((slide, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === currentSlide ? 1 : 0,
              transform: index === currentSlide ? 'scale(1.04)' : 'scale(1)',
              transition: 'opacity 1.5s ease-in-out, transform 8s ease-out',
            }}
          />
        ))}

        {/* Ambient Gradient Overlays for High Legibility & Luxury municipal feel */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.78) 75%, #f8fafc 100%)',
          backdropFilter: 'blur(1px)',
        }} />

        {/* Hero Content */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          padding: '60px 32px 40px',
          textAlign: 'center',
          color: '#ffffff',
          boxSizing: 'border-box',
        }}>
          {/* Municipal Tag */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '9999px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}>
            <span>🏛️ MADURAI MUNICIPAL CORPORATION</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span style={{ color: '#38bdf8' }}>SMART WATERWAYS GIS</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}>
            Smart Urban Drainage & AI Blockage Intelligence
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            lineHeight: 1.6,
            color: '#e2e8f0',
            maxWidth: '960px',
            margin: '0 auto 32px',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}>
            Real-time geospatial hydrography, predictive machine learning for plastic debris accumulation, and automated flood prevention across Madurai Corporation.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to="/dashboard"
              className="btn btn-primary"
              style={{
                fontSize: '15px',
                fontWeight: 700,
                padding: '14px 28px',
                borderRadius: '10px',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              🚀 Get Started — Launch Dashboard →
            </Link>

            <Link
              to="/map"
              className="btn btn-secondary"
              style={{
                fontSize: '15px',
                fontWeight: 700,
                padding: '14px 26px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#0f172a',
                border: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🗺️ Open Interactive GIS Map
            </Link>
          </div>

          {/* Slide Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '28px' }}>
            {MADURAI_SLIDES.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: idx === currentSlide ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: idx === currentSlide ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                title={slide.caption}
              />
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px' }}>
            📷 {MADURAI_SLIDES[currentSlide].caption}
          </div>
        </div>
      </div>

      {/* Main Body Content on Clean White Background */}
      <div style={{ width: '100%', margin: '-40px 0 40px', padding: '0 28px', position: 'relative', zIndex: 20, boxSizing: 'border-box' }}>
        {/* Live Metrics Ticker Bar */}
        <div className="card mb-4" style={{
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.03)',
          border: '1px solid #e2e8f0',
          padding: '22px 28px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '24px',
            alignItems: 'center',
            textAlign: 'center',
            width: '100%',
          }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-blue)' }}>37.8 km</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Drainage Channels</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>12 Wards</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Monitored Zones</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626' }}>274 Logs</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Blockages Triaged</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a' }}>87.2%</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Monsoon Readiness</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#7c3aed' }}>91.4%</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>ML XGBoost Accuracy</div>
            </div>
          </div>
        </div>

        {/* Feature Modules Grid */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>🏛️ Core Municipal Control Modules</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Explore operational GIS analysis, incident tracking & predictive models</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%' }}>
            {[
              {
                icon: '🗺️',
                title: 'GIS Waterway Map',
                desc: 'Fast Leaflet vector mapping of Madurai channels, culverts, and live incident GPS telemetry.',
                to: '/map',
                badge: 'Live Map',
                color: '#2563eb',
              },
              {
                icon: '📊',
                title: 'Executive Dashboard',
                desc: 'High-level KPIs, network summary, desilting progress, and municipal flood readiness index.',
                to: '/dashboard',
                badge: 'Overview',
                color: '#059669',
              },
              {
                icon: '🌊',
                title: 'Drainage Network Inventory',
                desc: 'Comprehensive inventory of 15 primary & secondary channels across Madurai Corporation Wards.',
                to: '/drainage-network',
                badge: '15 Channels',
                color: '#0284c7',
              },
              {
                icon: '🔴',
                title: 'Blockage Incidents Console',
                desc: 'Verified field observations, plastic waste composition (LDPE bags, PET), and overflow tracking.',
                to: '/incidents',
                badge: 'Field Logs',
                color: '#dc2626',
              },
              {
                icon: '🌧️',
                title: 'Rainfall Hydrology Impact',
                desc: 'IMD Madurai weather station correlation with historical Northeast monsoon blockage surges.',
                to: '/rainfall',
                badge: 'IMD Station',
                color: '#0284c7',
              },
              {
                icon: '🔥',
                title: 'Hotspot Spatial Clustering',
                desc: 'Kernel density ranking of top bottleneck sinks around Goripalayam, Simmakkal & Sellur.',
                to: '/hotspots',
                badge: 'Spatial Cluster',
                color: '#ea580c',
              },
              {
                icon: '⚠️',
                title: '6-Factor Risk Scoring',
                desc: 'Multi-factor weighted risk assessment index factoring in hydrology, market debris, and slope.',
                to: '/risk',
                badge: 'Formula Model',
                color: '#d97706',
              },
              {
                icon: '📈',
                title: 'Statistical Analytics',
                desc: '6 temporal and composition charts analyzing plastic types, hourly peaks, and ward distributions.',
                to: '/analytics',
                badge: '6 Charts',
                color: '#7c3aed',
              },
              {
                icon: '🤖',
                title: 'ML Prediction Engine',
                desc: 'XGBoost ensemble model predicting blockage probabilities and emergency maintenance windows.',
                to: '/ml',
                badge: 'AI Engine',
                color: '#2563eb',
              },
              {
                icon: '🔧',
                title: 'Intervention Work Orders',
                desc: 'Municipal work order tracking for mechanical desilting, trash traps, and before/after metrics.',
                to: '/interventions',
                badge: 'Operations',
                color: '#16a34a',
              },
            ].map((mod, idx) => (
              <Link
                key={idx}
                to={mod.to}
                className="card"
                style={{
                  padding: '20px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  borderTop: `3px solid ${mod.color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '26px' }}>{mod.icon}</span>
                  <span className="badge badge-info" style={{ fontSize: '10px' }}>{mod.badge}</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{mod.title}</h3>
                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, flex: 1 }}>{mod.desc}</p>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Explore module →
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Municipal Notice Footer */}
        <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '18px 24px', textAlign: 'center', fontSize: '13px', color: '#64748b', width: '100%', boxSizing: 'border-box' }}>
          🏛️ <strong>Madurai Municipal Corporation</strong> · Smart Urban Drainage & AI Plastic Blockage Platform · Verified Field GIS Network
        </div>
      </div>
    </div>
  )
}
