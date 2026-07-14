import pytest
from fastapi import HTTPException

from api.auth import require_api_key


def test_require_api_key_accepts_matching_key(monkeypatch):
    monkeypatch.setenv("API_KEY", "secret123")
    require_api_key(x_api_key="secret123")


def test_require_api_key_rejects_wrong_key(monkeypatch):
    monkeypatch.setenv("API_KEY", "secret123")
    with pytest.raises(HTTPException) as exc_info:
        require_api_key(x_api_key="wrong-key")
    assert exc_info.value.status_code == 401


def test_require_api_key_rejects_missing_key(monkeypatch):
    monkeypatch.setenv("API_KEY", "secret123")
    with pytest.raises(HTTPException) as exc_info:
        require_api_key(x_api_key=None)
    assert exc_info.value.status_code == 401


def test_require_api_key_rejects_when_not_configured(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    with pytest.raises(HTTPException) as exc_info:
        require_api_key(x_api_key="anything")
    assert exc_info.value.status_code == 401
