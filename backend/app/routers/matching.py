from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import P2PMatch, GuarantorNode
from ..schemas import P2PMatchResponse, GuarantorNodeResponse, P2PMatchCreate

router = APIRouter()

@router.get("/matches", response_model=List[P2PMatchResponse])
def get_p2p_matches(db: Session = Depends(get_db)):
    matches = db.query(P2PMatch).all()
    
    # Seed matching data locally if table is currently empty
    if not matches:
        seeds = [
            P2PMatch(match_code="SZB-8902", from_user="Rushi", to_user="Aarav", from_country="UK", to_country="India", amount_from="£100.00", amount_to="₹13,150.00", status="Settled Locally"),
            P2PMatch(match_code="SZB-8903", from_user="Rushi", to_user="Kabir", from_country="UK", to_country="UAE", amount_from="£66.00", amount_to="308.00 AED", status="Settled Locally"),
            P2PMatch(match_code="SZB-8904", from_user="Rushi", to_user="Liam", from_country="UK", to_country="Canada", amount_from="£50.00", amount_to="87.00 CAD", status="Queued - Matching Active")
        ]
        for seed in seeds:
            db.add(seed)
        db.commit()
        matches = db.query(P2PMatch).all()
        
    return matches

@router.post("/matches", response_model=P2PMatchResponse)
def create_p2p_match(payload: P2PMatchCreate, db: Session = Depends(get_db)):
    db_match = P2PMatch(**payload.model_dump())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

@router.get("/trust", response_model=List[GuarantorNodeResponse])
def get_trust_guarantors(db: Session = Depends(get_db)):
    guarantors = db.query(GuarantorNode).all()
    
    # Seed guarantor trust data locally if table is currently empty
    if not guarantors:
        seeds = [
            GuarantorNode(user_id=1, guarantor_name="Sister (Indira)", relation="Immediate Family", country="India", score_contribution="+35%", status="Active Guarantor"),
            GuarantorNode(user_id=1, guarantor_name="Uncle (Kabir)", relation="Extended Family", country="UAE", score_contribution="+25%", status="Active Guarantor"),
            GuarantorNode(user_id=1, guarantor_name="Brother (Aarav)", relation="Immediate Family", country="Canada", score_contribution="+20%", status="Active Guarantor"),
            GuarantorNode(user_id=1, guarantor_name="Friend (Max)", relation="Colleague", country="Germany", score_contribution="+14%", status="Pending Verification")
        ]
        for seed in seeds:
            db.add(seed)
        db.commit()
        guarantors = db.query(GuarantorNode).all()
        
    return guarantors
