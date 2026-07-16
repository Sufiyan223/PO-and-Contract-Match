import base64

import httpx
import msal

from schemas.outlook_schema import OutlookConfig

GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"
GRAPH_SCOPE = ["https://graph.microsoft.com/.default"]


class OutlookAuthError(Exception):
    pass


class NoMatchingEmailError(Exception):
    pass


class MissingAttachmentError(Exception):
    def __init__(self, attachment_type: str):
        self.attachment_type = attachment_type
        super().__init__(f"{attachment_type} attachment not found in the matching email")


class GraphApiError(Exception):
    pass


def _acquire_token(config: OutlookConfig) -> str:
    try:
        app = msal.ConfidentialClientApplication(
            client_id=config.client_id,
            client_credential=config.client_secret,
            authority=f"https://login.microsoftonline.com/{config.tenant_id}",
        )
        result = app.acquire_token_for_client(scopes=GRAPH_SCOPE)
    except Exception as error:
        raise OutlookAuthError(str(error)) from error

    if "access_token" not in result:
        raise OutlookAuthError(
            result.get("error_description", "Failed to authenticate with Outlook")
        )
    return result["access_token"]


def _find_attachment(attachments: list[dict], keywords: tuple[str, ...]) -> dict | None:
    for attachment in attachments:
        name = attachment.get("name", "").lower()
        if any(keyword in name for keyword in keywords):
            return attachment
    return None


def fetch_po_and_contract_attachments(config: OutlookConfig) -> tuple[bytes, bytes]:
    token = _acquire_token(config)
    headers = {"Authorization": f"Bearer {token}"}

    escaped_filter = config.subject_filter.replace("'", "''")
    with httpx.Client(base_url=GRAPH_BASE_URL, headers=headers, timeout=30.0) as client:
        search_response = client.get(
            f"/users/{config.mailbox}/messages",
            params={
                "$filter": f"contains(subject,'{escaped_filter}')",
                "$orderby": "receivedDateTime desc",
                "$top": "1",
            },
        )
        if search_response.status_code != 200:
            raise GraphApiError(f"Graph API error searching messages: {search_response.text}")

        messages = search_response.json().get("value", [])
        if not messages:
            raise NoMatchingEmailError("No matching email found")
        message_id = messages[0]["id"]

        attachments_response = client.get(f"/users/{config.mailbox}/messages/{message_id}/attachments")
        if attachments_response.status_code != 200:
            raise GraphApiError(f"Graph API error listing attachments: {attachments_response.text}")

        attachments = attachments_response.json().get("value", [])

    po_attachment = _find_attachment(attachments, ("po", "purchase"))
    if po_attachment is None:
        raise MissingAttachmentError("PO")

    contract_attachment = _find_attachment(attachments, ("contract", "agreement"))
    if contract_attachment is None:
        raise MissingAttachmentError("Contract")

    po_bytes = base64.b64decode(po_attachment["contentBytes"])
    contract_bytes = base64.b64decode(contract_attachment["contentBytes"])
    return po_bytes, contract_bytes
