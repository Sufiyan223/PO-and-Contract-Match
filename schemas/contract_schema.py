from pydantic import BaseModel


class ContractDetails(BaseModel):
    contract_agreement_number: str
    validity_start: str
    validity_end: str
    owner: str
    service_provider: str
    payment_terms: str
    liquidated_damage: str
    pricing_info: str
    bank_guarantee: str
    penalty_info: str
    confidence_notes: str
