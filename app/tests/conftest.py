import os
import sys

DASHBOARD_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if DASHBOARD_DIR not in sys.path:
    sys.path.insert(0, DASHBOARD_DIR)

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)
