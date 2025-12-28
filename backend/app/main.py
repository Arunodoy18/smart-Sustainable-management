from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import waste
from app.core.config import settings
from app.core.logger import setup_logger

setup_logger()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(waste.router, prefix=f"{settings.API_V1_STR}/waste", tags=["waste"])

@app.get("/")
async def root():
    return {"message": "Welcome to Smart Waste Management AI API", "docs": "/docs"}
