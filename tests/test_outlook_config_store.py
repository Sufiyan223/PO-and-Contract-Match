from schemas.outlook_schema import OutlookConfig
from outlook.config_store import load_config, save_config


def _make_config() -> OutlookConfig:
    return OutlookConfig(
        tenant_id="tenant-123",
        client_id="client-abc",
        client_secret="super-secret",
        mailbox="procurement@clientco.com",
        subject_filter="PO and Contract",
    )


def test_load_config_returns_none_when_no_file_exists(tmp_path, monkeypatch):
    import outlook.config_store as store

    monkeypatch.setattr(store, "CONFIG_PATH", tmp_path / "outlook_config.json")
    assert load_config() is None


def test_save_and_load_config_round_trip(tmp_path, monkeypatch):
    import outlook.config_store as store

    monkeypatch.setattr(store, "CONFIG_PATH", tmp_path / "outlook_config.json")

    config = _make_config()
    save_config(config)
    loaded = load_config()

    assert loaded == config


def test_save_config_overwrites_existing_file(tmp_path, monkeypatch):
    import outlook.config_store as store

    monkeypatch.setattr(store, "CONFIG_PATH", tmp_path / "outlook_config.json")

    save_config(_make_config())
    updated = _make_config()
    updated.subject_filter = "New Filter"
    save_config(updated)

    loaded = load_config()
    assert loaded.subject_filter == "New Filter"
