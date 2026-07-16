import json
from pathlib import Path

from schemas.outlook_schema import OutlookConfig

CONFIG_PATH = Path(__file__).parent.parent / "config" / "outlook_config.json"


def load_config() -> OutlookConfig | None:
    if not CONFIG_PATH.exists():
        return None
    return OutlookConfig(**json.loads(CONFIG_PATH.read_text()))


def save_config(config: OutlookConfig) -> None:
    CONFIG_PATH.parent.mkdir(exist_ok=True)
    CONFIG_PATH.write_text(json.dumps(config.model_dump(), indent=2))
