from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import chat, matching

# Auto migrate schemas on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Saan Voice API Portal",
    description="Backend microservices handling local P2P settlement & community trust scoring",
    version="2.0.0"
)

# CORS configurations for React client communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints
app.include_router(chat.router, prefix="/api")
app.include_router(matching.router, prefix="/api")

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "Saan Voice Backend Service Engine",
        "version": "2.0.0"
    }
