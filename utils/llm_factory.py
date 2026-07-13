import os
from crewai import LLM


def get_llm() -> LLM:
    if os.environ.get("ANTHROPIC_API_KEY"):
        return LLM(
            model="anthropic/claude-sonnet-4-6",
            api_key=os.environ["ANTHROPIC_API_KEY"],
        )
    if os.environ.get("GEMINI_API_KEY"):
        return LLM(
            model="gemini/gemini-2.0-flash",
            api_key=os.environ["GEMINI_API_KEY"],
        )
    if os.environ.get("OPENROUTER_API_KEY"):
        return LLM(
            model="openrouter/nvidia/nemotron-3-ultra-550b-a55b:free",
            api_key=os.environ["OPENROUTER_API_KEY"],
            base_url="https://openrouter.ai/api/v1",
        )
    raise EnvironmentError(
        "Set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY before running."
    )
