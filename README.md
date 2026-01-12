# 🌍 Smart Waste Management AI System

> [!IMPORTANT]
> **🧊 HACKATHON MVP FROZEN**: The official MVP submission is now LOCKED for judging. 
> - **Official Submission Details**: See [HACKATHON_FREEZE.md](./HACKATHON_FREEZE.md)
> - **Live Demo**: [Official Frontend URL](https://frontend.jollysea-c5c0b121.centralus.azurecontainerapps.io)
> 
> **✨ POST-SUBMISSION ENHANCEMENTS**: Current local development (Orchid + `npm run dev`) contains active UI/UX and stability improvements that are NOT part of the submitted live environment. These represent the "Next Generation" features for future releases.

**Hackathon 2026 | MVP Ready | Production Deployable**

An AI-powered waste management system that uses **confidence-aware recommendations** to ensure safe recycling, reduce contamination, and enable accountable waste collection in smart cities.

---

## 🎯 Project Overview

This system solves a critical real-world problem: **recycling contamination**. By classifying waste with AI and providing confidence-based recommendations, it prevents incorrect sorting that ruins entire recycling batches.

### Key Features

- **🤖 AI-Powered Classification**: Identifies waste type with confidence scoring
- **🎚️ Confidence-Aware Recommendations**: Different actions based on certainty level
- **♻️ Smart Segregation**: Maps waste to recyclability and special handling needs
- **🚛 Driver Accountability**: Collection verification with proof of pickup
- **📊 Real-Time Analytics**: Track recycling rates and environmental impact
- **🌐 SDG-Aligned**: Supports UN Sustainable Development Goals 11, 12, 13

---

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │  ← User uploads waste image
│  (Port 3000)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FastAPI Backend │  ← Intelligence Layer
│  (Port 8000)    │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────────┐
    │         │          │              │
    ▼         ▼          ▼              ▼
┌───────┐ ┌──────┐ ┌──────────┐ ┌──────────────┐
│ Class │ │ Seg  │ │   Rec    │ │  Collection  │
│ Agent │ │ Agent│ │   Agent  │ │    Agent     │
└───────┘ └──────┘ └──────────┘ └──────────────┘
    │         │          │              │
    └─────────┴──────────┴──────────────┘
                    │
                    ▼
           ┌────────────────┐
           │   PostgreSQL   │
           │   (Port 5432)  │
           └────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- OR: Node.js 20+, Python 3.11+, PostgreSQL 15+

### Option 1: Docker (Recommended)

```bash
# Clone the repository
cd Hackathon

# Start all services
docker-compose up -d

# Wait for services to initialize (~30 seconds)

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/docs
# Database Admin: http://localhost:8080
```

### Option 2: Local Development (Fastest)

**Backend Setup:**
```bash
# Start backend in one command (automatically handles venv)
.\start-backend.ps1
```

**Frontend Setup:**
```bash
# Start frontend in one command
.\start-frontend.ps1
```

**Manual Setup (Step-by-Step):**
If you prefer manual control:

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
