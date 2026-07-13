import pytest
from utils.llm_factory import get_llm


def test_get_llm_uses_anthropic_when_key_set(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    llm = get_llm()
    assert "claude" in llm.model.lower()


def test_get_llm_falls_back_to_gemini(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    llm = get_llm()
    assert "gemini" in llm.model.lower()


def test_get_llm_falls_back_to_openrouter(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-key")
    llm = get_llm()
    assert "openrouter" in llm.model.lower()


def test_get_llm_raises_when_no_key_set(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(EnvironmentError, match="Set ANTHROPIC_API_KEY"):
        get_llm()
