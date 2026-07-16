from pydantic import BaseModel


class OutlookConfig(BaseModel):
    tenant_id: str
    client_id: str
    client_secret: str
    mailbox: str
    subject_filter: str
