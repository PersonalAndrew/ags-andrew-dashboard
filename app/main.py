from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import router
from app.api.statsbomb_routes import router as statsbomb_router

app = FastAPI(title="SofaScore Player Dashboard", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
FRONTEND_DIR = Path(__file__).parent / "frontend"
app.mount("/dashboard", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
app.include_router(router, prefix="")
app.include_router(statsbomb_router, prefix="")
from fastapi.responses import FileResponse, RedirectResponse
from pathlib import Path

FRONTEND_DIR = Path(__file__).parent / "frontend"

@app.get("/")
def home():
    return RedirectResponse(url="/dashboard/index.html")