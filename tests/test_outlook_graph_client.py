import base64
from unittest.mock import MagicMock, patch

import pytest

from outlook.graph_client import (
    GraphApiError,
    MissingAttachmentError,
    NoMatchingEmailError,
    OutlookAuthError,
    fetch_po_and_contract_attachments,
)
from schemas.outlook_schema import OutlookConfig

CONFIG = OutlookConfig(
    tenant_id="tenant-123",
    client_id="client-abc",
    client_secret="super-secret",
    mailbox="procurement@clientco.com",
    subject_filter="PO and Contract",
)

PO_BYTES = b"%PDF-1.4 po content"
CONTRACT_BYTES = b"%PDF-1.4 contract content"


def _make_client_mock(search_response, attachments_response=None):
    client = MagicMock()
    client.__enter__.return_value = client
    client.__exit__.return_value = False
    if attachments_response is None:
        client.get.return_value = search_response
    else:
        client.get.side_effect = [search_response, attachments_response]
    return client


def _response(status_code: int, json_data: dict, text: str = "") -> MagicMock:
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_data
    response.text = text
    return response


def _attachment(name: str, content: bytes) -> dict:
    return {"name": name, "contentBytes": base64.b64encode(content).decode("ascii")}


@patch("outlook.graph_client.httpx.Client")
@patch("outlook.graph_client.msal.ConfidentialClientApplication")
def test_fetch_returns_po_and_contract_bytes_on_success(mock_msal_app, mock_httpx_client):
    mock_msal_app.return_value.acquire_token_for_client.return_value = {"access_token": "token123"}
    search_response = _response(200, {"value": [{"id": "msg-1"}]})
    attachments_response = _response(
        200,
        {
            "value": [
                _attachment("Purchase_Order.pdf", PO_BYTES),
                _attachment("Contract_Agreement.pdf", CONTRACT_BYTES),
            ]
        },
    )
    mock_httpx_client.return_value = _make_client_mock(search_response, attachments_response)

    po_bytes, contract_bytes = fetch_po_and_contract_attachments(CONFIG)

    assert po_bytes == PO_BYTES
    assert contract_bytes == CONTRACT_BYTES


@patch("outlook.graph_client.msal.ConfidentialClientApplication")
def test_fetch_raises_auth_error_when_token_acquisition_fails(mock_msal_app):
    mock_msal_app.return_value.acquire_token_for_client.return_value = {
        "error_description": "invalid client secret"
    }

    with pytest.raises(OutlookAuthError, match="invalid client secret"):
        fetch_po_and_contract_attachments(CONFIG)


@patch("outlook.graph_client.msal.ConfidentialClientApplication")
def test_fetch_raises_auth_error_when_msal_raises_on_invalid_tenant(mock_msal_app):
    mock_msal_app.side_effect = ValueError(
        "Unable to get authority configuration for https://login.microsoftonline.com/test-tenant"
    )

    with pytest.raises(OutlookAuthError, match="Unable to get authority configuration"):
        fetch_po_and_contract_attachments(CONFIG)


@patch("outlook.graph_client.httpx.Client")
@patch("outlook.graph_client.msal.ConfidentialClientApplication")
def test_fetch_raises_no_matching_email_error_when_search_is_empty(mock_msal_app, mock_httpx_client):
    mock_msal_app.return_value.acquire_token_for_client.return_value = {"access_token": "token123"}
    search_response = _response(200, {"value": []})
    mock_httpx_client.return_value = _make_client_mock(search_response)

    with pytest.raises(NoMatchingEmailError):
        fetch_po_and_contract_attachments(CONFIG)


@patch("outlook.graph_client.httpx.Client")
@patch("outlook.graph_client.msal.ConfidentialClientApplication")
def test_fetch_raises_missing_attachment_error_for_po(mock_msal_app, mock_httpx_client):
    mock_msal_app.return_value.acquire_token_for_client.return_value = {"access_token": "token123"}
    search_response = _response(200, {"value": [{"id": "msg-1"}]})
    attachments_response = _response(
        200, {"value": [_attachment("Contract_Agreement.pdf", CONTRACT_BYTES)]}
    )
    mock_httpx_client.return_value = _make_client_mock(search_response, attachments_response)

    with pytest.raises(MissingAttachmentError) as exc_info:
        fetch_po_and_contract_attachments(CONFIG)
    assert exc_info.value.attachment_type == "PO"


@patch("outlook.graph_client.httpx.Client")
@patch("outlook.graph_client.msal.ConfidentialClientApplication")
def test_fetch_raises_missing_attachment_error_for_contract(mock_msal_app, mock_httpx_client):
    mock_msal_app.return_value.acquire_token_for_client.return_value = {"access_token": "token123"}
    search_response = _response(200, {"value": [{"id": "msg-1"}]})
    attachments_response = _response(200, {"value": [_attachment("Purchase_Order.pdf", PO_BYTES)]})
    mock_httpx_client.return_value = _make_client_mock(search_response, attachments_response)

    with pytest.raises(MissingAttachmentError) as exc_info:
        fetch_po_and_contract_attachments(CONFIG)
    assert exc_info.value.attachment_type == "Contract"


@patch("outlook.graph_client.httpx.Client")
@patch("outlook.graph_client.msal.ConfidentialClientApplication")
def test_fetch_raises_graph_api_error_on_search_failure(mock_msal_app, mock_httpx_client):
    mock_msal_app.return_value.acquire_token_for_client.return_value = {"access_token": "token123"}
    search_response = _response(403, {}, text="Forbidden")
    mock_httpx_client.return_value = _make_client_mock(search_response)

    with pytest.raises(GraphApiError):
        fetch_po_and_contract_attachments(CONFIG)
