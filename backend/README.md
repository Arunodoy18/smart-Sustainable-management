# Smart AI-Powered Waste Management System (SDG 11)

This project is a production-grade backend platform designed for the Microsoft Imagine Cup. It leverages a modular Agent-Based Architecture to digitize and optimize the waste lifecycle.

## Core Features
- **Waste Classification Agent**: Uses computer vision (simulated) to classify waste into Organic, Recyclable, Hazardous, and E-waste.
- **Collection Agent**: Verifies pickups by drivers, validates segregation quality, and manages reward/penalty logic.
- **Prediction Agent**: Predicts bin overflow based on area density and historical data.
- **Recommendation Agent**: Provides personalized tips for waste reduction and better segregation.
- **Segregation Agent**: Validates segregation quality and flags violations.

## Tech Stack
- **Framework**: FastAPI (Python 3.11)
- **Architecture**: Modular Agents with Shared Base Class
- **Database**: PostgreSQL (Relational) + Qdrant (Vector DB for image embeddings)
- **Security**: JWT Authentication + Role-Based Access Control (RBAC)
- **Logging**: Loguru for production-grade traceability

## Project Structure
```text
backend/
├── app/
│   ├── main.py             # FastAPI Entry Point
│   ├── core/               # Config, Security, Logger
│   ├── api/routes/         # API Endpoints
│   ├── agents/             # Modular AI Agents
│   ├── schemas/            # Pydantic Models
│   └── ...
├── Dockerfile
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (if running locally)

### Run with Docker
```bash
docker-compose up --build
```

### Local Development
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the API:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation
Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## AI Responsibility & Explainability
Every agent response includes a `reasoning` field and a `confidence` score, ensuring that AI decisions are transparent and auditable by city authorities.
