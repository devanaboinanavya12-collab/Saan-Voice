from pydantic import BaseModel
from typing import Dict, Any, Optional

class ChatRequest(BaseModel):
    message: str
    state: Dict[str, Any]

class ChatResponse(BaseModel):
    speechText: str
    action: str
    targetTab: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class P2PMatchCreate(BaseModel):
    match_code: str
    from_user: str
    to_user: str
    from_country: str
    to_country: str
    amount_from: str
    amount_to: str

class P2PMatchResponse(BaseModel):
    id: int
    match_code: str
    from_user: str
    to_user: str
    from_country: str
    to_country: str
    amount_from: str
    amount_to: str
    status: str

    class Config:
        from_attributes = True

class GuarantorNodeResponse(BaseModel):
    id: int
    guarantor_name: str
    relation: str
    country: str
    score_contribution: str
    status: str

    class Config:
        from_attributes = True
