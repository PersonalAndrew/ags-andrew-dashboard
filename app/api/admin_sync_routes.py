from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

router = APIRouter(prefix="/api/admin/sync", tags=["Admin Sync"])

PROJECT_ROOT = Path(__file__).resolve().parents[2]
STATUS_FILE = PROJECT_ROOT / "data" / "sync_status.json"

SYNC_LOCK = threading.Lock()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_status() -> dict[str, Any]:
    if not STATUS_FILE.exists():
        return {
            "running": False,
            "task": None,
            "started_at": None,
            "finished_at": None,
            "success": None,
            "message": "Nenhum sync executado ainda.",
            "steps": [],
        }

    try:
        return json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {
            "running": False,
            "task": None,
            "started_at": None,
            "finished_at": None,
            "success": False,
            "message": "Nao foi possivel ler o status do sync.",
            "steps": [],
        }


def write_status(status: dict[str, Any]) -> None:
    STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATUS_FILE.write_text(
        json.dumps(status, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def require_admin_token(x_ags_admin_token: str | None) -> None:
    expected = os.getenv("AGS_ADMIN_TOKEN")

    # Em desenvolvimento local, se nao houver token configurado, libera.
    if not expected:
        return

    if x_ags_admin_token != expected:
        raise HTTPException(status_code=401, detail="Token administrativo invalido.")


def run_command(command: list[str], label: str, timeout_seconds: int = 3600) -> dict[str, Any]:
    started_at = now_iso()

    try:
        completed = subprocess.run(
            command,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )

        output = (completed.stdout or "") + "\n" + (completed.stderr or "")

        return {
            "label": label,
            "command": " ".join(command),
            "started_at": started_at,
            "finished_at": now_iso(),
            "returncode": completed.returncode,
            "success": completed.returncode == 0,
            "output_tail": output[-12000:],
        }

    except subprocess.TimeoutExpired as error:
        output = ((error.stdout or "") if isinstance(error.stdout, str) else "") + "\n"
        output += ((error.stderr or "") if isinstance(error.stderr, str) else "")

        return {
            "label": label,
            "command": " ".join(command),
            "started_at": started_at,
            "finished_at": now_iso(),
            "returncode": None,
            "success": False,
            "output_tail": ("TIMEOUT\n" + output)[-12000:],
        }

    except Exception as error:
        return {
            "label": label,
            "command": " ".join(command),
            "started_at": started_at,
            "finished_at": now_iso(),
            "returncode": None,
            "success": False,
            "output_tail": str(error),
        }


def script_command(script_name: str, *args: str) -> list[str]:
    return [sys.executable, str(PROJECT_ROOT / "scripts" / script_name), *args]


def run_sync_task(task_name: str, commands: list[tuple[str, list[str]]]) -> None:
    if not SYNC_LOCK.acquire(blocking=False):
        status = read_status()
        status["message"] = "Ja existe uma sincronizacao em andamento."
        write_status(status)
        return

    status = {
        "running": True,
        "task": task_name,
        "started_at": now_iso(),
        "finished_at": None,
        "success": None,
        "message": f"Sincronizacao iniciada: {task_name}",
        "steps": [],
    }
    write_status(status)

    try:
        all_success = True

        for label, command in commands:
            status = read_status()
            status["message"] = f"Executando: {label}"
            write_status(status)

            step = run_command(command, label=label)
            status = read_status()
            status.setdefault("steps", []).append(step)
            write_status(status)

            if not step["success"]:
                all_success = False
                break

        status = read_status()
        status["running"] = False
        status["finished_at"] = now_iso()
        status["success"] = all_success
        status["message"] = (
            f"Sincronizacao finalizada com sucesso: {task_name}"
            if all_success
            else f"Sincronizacao finalizada com erro: {task_name}"
        )
        write_status(status)

    finally:
        SYNC_LOCK.release()


def copa2026_commands() -> list[tuple[str, list[str]]]:
    commands = [
        (
            "Atualizar JSONs SofaScore Copa 2026",
            script_command("sync_sofascore.py"),
        ),
    ]

    build_xg = PROJECT_ROOT / "scripts" / "build_sofascore_xg.py"

    if build_xg.exists():
        commands.append(
            (
                "Regerar base xG SofaScore Copa 2026",
                script_command("build_sofascore_xg.py"),
            )
        )

    return commands


def brasileirao_commands() -> list[tuple[str, list[str]]]:
    return [
        (
            "Atualizar JSONs SofaScore Brasileirao",
            script_command("sync_sofascore_brasileirao.py", "--max-pages", "20"),
        ),
        (
            "Regerar base xG SofaScore Brasileirao",
            script_command("build_brasileirao_sofascore_xg.py"),
        ),
    ]


@router.get("/status")
def get_sync_status() -> dict[str, Any]:
    return read_status()


@router.post("/copa2026")
def sync_copa2026(
    background_tasks: BackgroundTasks,
    x_ags_admin_token: str | None = Header(default=None),
) -> dict[str, Any]:
    require_admin_token(x_ags_admin_token)

    status = read_status()

    if status.get("running"):
        raise HTTPException(status_code=409, detail="Ja existe uma sincronizacao em andamento.")

    background_tasks.add_task(run_sync_task, "copa2026", copa2026_commands())

    return {
        "accepted": True,
        "task": "copa2026",
        "message": "Sync da Copa 2026 iniciado em segundo plano.",
        "status_url": "/api/admin/sync/status",
    }


@router.post("/brasileirao")
def sync_brasileirao(
    background_tasks: BackgroundTasks,
    x_ags_admin_token: str | None = Header(default=None),
) -> dict[str, Any]:
    require_admin_token(x_ags_admin_token)

    status = read_status()

    if status.get("running"):
        raise HTTPException(status_code=409, detail="Ja existe uma sincronizacao em andamento.")

    background_tasks.add_task(run_sync_task, "brasileirao", brasileirao_commands())

    return {
        "accepted": True,
        "task": "brasileirao",
        "message": "Sync do Brasileirao iniciado em segundo plano.",
        "status_url": "/api/admin/sync/status",
    }


@router.post("/all")
def sync_all(
    background_tasks: BackgroundTasks,
    x_ags_admin_token: str | None = Header(default=None),
) -> dict[str, Any]:
    require_admin_token(x_ags_admin_token)

    status = read_status()

    if status.get("running"):
        raise HTTPException(status_code=409, detail="Ja existe uma sincronizacao em andamento.")

    commands = copa2026_commands() + brasileirao_commands()
    background_tasks.add_task(run_sync_task, "all", commands)

    return {
        "accepted": True,
        "task": "all",
        "message": "Sync da Copa 2026 e do Brasileirao iniciado em segundo plano.",
        "status_url": "/api/admin/sync/status",
    }