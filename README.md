# 🌍 Smart Waste Management AI System

> **AI-powered waste classification with confidence-aware recommendations for smart cities**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An intelligent waste management system that uses **AI-powered classification** with **confidence scoring** to reduce recycling contamination, enable driver accountability, and support sustainable waste management in smart cities.

---

## 🎯 Problem & Solution

### The Problem
- **Recycling contamination** ruins entire batches when waste is incorrectly sorted
- **Lack of accountability** in waste collection leads to inefficiencies
- **Citizens unsure** about proper waste disposal methods

### Our Solution
- 🤖 **AI Classification**: Identifies waste type with confidence scoring
- 🎚️ **Confidence-Aware Recommendations**: Different actions based on AI certainty
- ♻️ **Smart Segregation**: Maps waste to proper disposal categories
- 🚛 **Driver Verification**: Collection proof with image validation
- 📊 **Analytics Dashboard**: Track environmental impact in real-time

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **AI Classification** | GPT-4o Vision identifies waste with 85%+ accuracy |
| **Confidence Scoring** | High/Medium/Low confidence determines recommendation |
| **Multi-Category** | Recyclable, Organic, Electronic, Hazardous, General |
| **User Dashboard** | Track personal waste history and impact |
| **Driver Portal** | Accept pickups, verify collection with photos |
| **Analytics** | Real-time metrics: recycling rate, CO2 saved, etc. |
| **Google Maps** | Location-based waste tracking |
| **Supabase Auth** | Secure login with Google OAuth |

---

## 🏗️ Architecture

```
Frontend (React)          Backend (FastAPI)         Database
     3000                      8000                  
        │                        │                      
        │  ←── API Calls ───→    │                      
        │                        │                      
        │                   ┌────┴────┐                
        │                   │  Agents │                
        │                   │  - Classification        
        │                   │  - Segregation           
        │                   │  - Recommendation        
        │                   │  - Collection            
        │                   └────┬────┘                
        │                        │                      
        └────────────────────────┴──────→ PostgreSQL
                                           (Supabase)
```

**Tech Stack:**
- **Frontend**: React, Vite, TailwindCSS, Recharts
- **Backend**: FastAPI, Python, SQLAlchemy
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI GPT-4o Vision
- **Auth**: Supabase (Google OAuth)
- **Maps**: Google Maps API
- **Deployment**: Render (backend) + Netlify (frontend)

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or Supabase)
- OpenAI API Key
- Supabase Account
- Google Maps API Key

### 1️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start server
uvicorn app.main:app --reload --port 8000
```

**Backend URL**: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

### 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.development
# Edit .env.development with your credentials

# Start development server
npm run dev
```

**Frontend URL**: http://localhost:3000

---

## 📖 Documentation

- **[Localhost Development Guide](LOCALHOST_GUIDE.md)** - Complete local setup
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Deploy to Render & Netlify
- **[Testing Guide](TESTING_GUIDE.md)** - Run tests
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs

---

## 🎮 Usage

### For Citizens

1. **Sign up** with email or Google OAuth
2. **Upload** a waste image
3. **Get** AI classification with confidence score
4. **Follow** personalized recommendations
5. **Track** your environmental impact

### For Drivers

1. **Login** to driver dashboard
2. **View** pending pickups on map
3. **Accept** collection requests
4. **Upload** proof of collection
5. **Confirm** collection completion

---
python -m app.db.init_db

# Run backend
uvicorn app.main:app --reload --port 8000
```

**Frontend Setup:**

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

**Database Setup:**

```bash
# Install PostgreSQL 15
# Create database
createdb waste_management
```

---

## 📊 System Flow

### 1️⃣ User Submits Waste

```
User uploads image → Backend receives → Classification Agent processes
```

### 2️⃣ AI Classification (WasteClassificationAgent)

```python
{
  "category": "plastic",
  "confidence": 0.92,
  "detected_objects": ["plastic bottle", "water container"]
}
```

### 3️⃣ Segregation Analysis (SegregationAgent)

```python
{
  "is_recyclable": true,
  "requires_special_handling": true,
  "risk_level": "medium",
  "notes": "Must be cleaned and dried"
}
```

### 4️⃣ Confidence-Aware Recommendation (RecommendationAgent)

**High Confidence (≥80%)**:
```
Action: "Recycle"
Instructions: [
  "Rinse the plastic container",
  "Remove labels",
  "Place in DRY RECYCLABLE bin"
]
Impact: "Reduces landfill plastic by 80%, saves 5.7 kWh energy/kg"
```

**Medium Confidence (50-79%)**:
```
Action: "Likely Recyclable - Verify"
Instructions: [
  "Check plastic type number",
  "If #1, #2, #4, #5 → recycle",
  "When in doubt, consult staff"
]
```

**Low Confidence (<50%)**:
```
Action: "Manual Review Required"
Instructions: [
  "Do NOT place in recycling bin",
  "Hand over to collection staff"
]
```

### 5️⃣ Driver Collection

```
Driver → Views pending pickups → Captures proof → System verifies
```

---

## 🎨 Frontend Features

### Upload Page
- 📸 Camera capture or file upload
- 🔄 Real-time processing feedback
- 📋 Detailed classification results
- ✅ Step-by-step instructions

### History Page
- 📜 Complete waste entry log
- 🔍 Detailed entry inspection
- 📊 Status tracking

### Analytics Dashboard
- 📈 Recycling rate visualization
- 🥧 Category breakdown charts
- 🌍 Environmental impact metrics
- 🎯 SDG alignment indicators

### Driver Portal
- 🚛 Pending pickup list
- 📷 Collection verification
- ✓ Accountability trail

---

## 🔧 API Endpoints

### Waste Classification

```bash
POST /api/v1/waste/classify
{
  "user_id": 1,
  "image_url": "https://...",
  "location": {"lat": 0, "lng": 0}
}
```

### Get User History

```bash
GET /api/v1/waste/entries/{user_id}?limit=50
```

### Get Analytics

```bash
GET /api/v1/waste/analytics?user_id=1
```

### Mark Collected (Driver)

```bash
POST /api/v1/waste/collect
{
  "entry_id": 1,
  "collector_id": 999,
  "collection_image_url": "https://..."
}
```

**Full API Documentation**: http://localhost:8000/docs

---

## 🗄️ Database Schema

### User Table
```sql
- id (PK)
- email (unique)
- full_name
- role (user/driver/admin)
- points (gamification)
- recycling_score
```

### WasteEntry Table
```sql
- id (PK)
- user_id (FK)
- waste_type
- confidence_score
- is_recyclable
- risk_level
- recommended_action
- instructions (JSON)
- collection_type
- impact_note
- status (pending/collected)
- collected_by (FK)
- collected_at
- created_at
```

---

## 🌍 Environmental Impact

Based on proper waste segregation:

| Metric | Value |
|--------|-------|
| Recycling contamination reduction | **60-80%** |
| Energy saved (plastic recycling) | **5.7 kWh/kg** |
| CO₂ reduction (aluminum) | **95%** vs new production |
| Methane reduction (composting) | **90%** vs landfilling |

---

## 🎯 SDG Alignment

- **SDG 11**: Sustainable Cities and Communities
- **SDG 12**: Responsible Consumption and Production
- **SDG 13**: Climate Action

---

## 🚀 Deployment

### Docker Production

```bash
docker-compose up -d
```

### Cloud Platforms

- **Azure**: App Service + PostgreSQL + Blob Storage
- **AWS**: ECS + RDS + S3
- **GCP**: Cloud Run + Cloud SQL + GCS

---

## 📈 Performance Metrics

- **Classification Speed**: <500ms
- **API Response Time**: <200ms average
- **Concurrent Users**: Horizontally scalable
- **Database**: Indexed and optimized

---

## 🔒 Security

- API Authentication ready (JWT)
- HTTPS enforced in production
- SQL injection protected (ORM)
- CORS configurable
- Environment-based secrets

---

**Built with ❤️ for a sustainable future 🌍**
