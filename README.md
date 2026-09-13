# 🌊 Smart Urban Drainage Plastic Blockage Analysis & Prevention System

> **Madurai Municipal Corporation Study Area — Real OpenStreetMap Spatial Vector Network & AI Risk Engine**

A full-stack, GIS-based municipal decision-support system for monitoring, analyzing, predicting, and preventing plastic waste blockages across urban drainage channels and outfalls in **Madurai, Tamil Nadu**.

---

## ✨ Features & System Capabilities

- **🗺️ Real GIS Spatial Drainage Network:** 187 real OpenStreetMap (OSM) drainage lines, canals, streams, and outfalls (including the Vaigai River tributaries, Sellur Main Canal, Kiruthumal River Basin, Sathaiyar, and Vandiyur Channel).
- **🧮 Transparent 6-Factor Risk Assessment Index:** Multi-factor weighted formula (`30% History`, `20% Monsoon Rainfall`, `20% Plastic Proximity`, `10% Channel Structure`, `10% Market Activity`, `10% Cleaning Recency`) with inspectable factor breakdowns.
- **🤖 Machine Learning Probability Predictor:** Scikit-Learn RandomForest classifier trained on spatial channel features predicting next-monsoon clog likelihood.
- **📈 Statistical Analytics & Temporal Insights:** 6 interactive chart suites powered by Recharts (Monthly Trends, Plastic Composition, Top Blocked Channels, Hourly Distributions, Ward Comparisons, Severity Levels).
- **🔧 7-State Preventive Interventions Workflow:** Issue municipal work orders for heavy trash traps, desilting, and culvert upgrades with before/after impact evaluation.
- **📋 Council-Ready Executive Reports:** Print-ready executive reports supporting native `window.print()`.
- **🗄️ Data Provenance & CSV Parser:** Batch import field blockage logs and inspect dataset verification levels.
- **✨ Luxury Glassmorphism Dark UI:** Styled with Google Fonts (**Outfit** & **Plus Jakarta Sans**), subtle ambient mesh lighting, and micro-animations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Mapping:** React-Leaflet + Leaflet 1.9 (OpenStreetMap vector tile basemaps)
- **Data Visualization:** Recharts
- **Icons & Styling:** Custom CSS Glassmorphism Design System

### Backend
- **Framework:** Python FastAPI (Uvicorn ASGI Server)
- **Database & ORM:** SQLite (`drainage.db`) + SQLModel (SQLAlchemy + Pydantic)
- **Spatial Processing:** GeoJSON LineStrings & Polygons, OpenStreetMap Overpass Parser
- **Machine Learning:** Scikit-Learn (RandomForest Classifier)

---

## 🚀 Local Installation & Setup Guide

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)

### 1. Clone Repository & Setup Backend

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/smart-drainage.git
cd smart-drainage

# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed the real OpenStreetMap Madurai dataset
python -m app.db.seed_real_madurai

# Start the FastAPI server
python run.py
```
*Backend API will run at `http://localhost:8000`*

### 2. Setup Frontend

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```
*Frontend application will run at `http://localhost:3000`*

---

## 🌐 Free Cloud Deployment Guide

### Option 1: Backend Deployment on Render (Free Tier)
1. Push this project to GitHub.
2. Go to [Render.com](https://render.com) ➔ New **Web Service**.
3. Select your GitHub repository.
4. Set **Root Directory** to `backend`.
5. Set **Build Command**: `pip install -r requirements.txt && python -m app.db.seed_real_madurai`
6. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Option 2: Frontend Deployment on Vercel / Netlify (Free Tier)
1. Go to [Vercel.com](https://vercel.com) ➔ Import Project.
2. Select `frontend` directory.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add environment variable `VITE_API_BASE_URL` pointing to your deployed backend URL.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
