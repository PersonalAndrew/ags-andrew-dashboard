from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.api.statsbomb_routes import router as statsbomb_router


app = FastAPI(
    title="AGS Performance Análises",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent / "frontend"


@app.get("/")
def home():
    return RedirectResponse(url="/dashboard/index.html")


@app.get("/dashboard/index.html")
def hub_dashboard():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/dashboard/copa2022.html")
def copa2022_dashboard():
    return FileResponse(FRONTEND_DIR / "copa2022.html")


@app.get("/dashboard/copa2026.html")
def copa2026_dashboard():
    return FileResponse(FRONTEND_DIR / "copa2026.html")


@app.get("/dashboard/comparativo.html")
def comparativo_dashboard():
    return FileResponse(FRONTEND_DIR / "comparativo.html")


app.mount(
    "/dashboard",
    StaticFiles(directory=str(FRONTEND_DIR), html=True),
    name="frontend"
)

app.include_router(router, prefix="")
app.include_router(statsbomb_router, prefix="")