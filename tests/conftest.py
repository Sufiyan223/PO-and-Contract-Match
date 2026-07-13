import sys
from unittest.mock import MagicMock
from pydantic import BaseModel

# Mock crewai immediately when this conftest is loaded
# This must happen before pytest tries to import test modules
class MockLLM:
    def __init__(self, model, api_key, base_url=None):
        self.model = model
        self.api_key = api_key
        if base_url:
            self.base_url = base_url

class MockBaseTool(BaseModel):
    """Mock BaseTool for testing. Inherits from Pydantic BaseModel."""
    pass

mock_crewai = MagicMock()
mock_crewai.LLM = MockLLM
mock_crewai.tools.BaseTool = MockBaseTool

sys.modules["crewai"] = mock_crewai
sys.modules["crewai.tools"] = MagicMock(BaseTool=MockBaseTool)
