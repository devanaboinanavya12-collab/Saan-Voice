import httpx
from fastapi import APIRouter, HTTPException
from ..schemas import ChatRequest, ChatResponse
from ..config import settings

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def process_chat(payload: ChatRequest):
    user_msg = payload.message
    state = payload.state
    
    # Extract states safely with defaults
    rates = state.get("fxRates", {})
    inr_rate = rates.get("INR", "131.50")
    aed_rate = rates.get("AED", "4.67")
    cad_rate = rates.get("CAD", "1.74")
    eur_rate = rates.get("EUR", "1.18")
    usd_rate = rates.get("USD", "1.27")
    
    loan_balance = state.get("loanBalance", 300.0)
    loan_paid = state.get("loanPaid", 216.0)
    loan_remaining = loan_balance - loan_paid
    
    current_from = state.get("currentFrom", "GBP")
    current_to = state.get("currentTo", "INR")
    
    active_rate = rates.get(current_to, "1.0")

    # Build Gemini system instructions
    system_prompt = f"""
You are Saan AI, an intelligent voice-activated financial assistant. You help Rushi (a borrower based in the UK) with emergency funding and collaborative cross-border repayments.

The current dashboard state is:
- Chosen "From" base currency: {current_from}
- Chosen "To" target currency: {current_to}
- Current active FX Rate: 1 {current_from} = {active_rate} {current_to}
- Current FX Rates relative to {current_from}: GBP = 1.0, INR = {inr_rate}, AED = {aed_rate}, CAD = {cad_rate}, EUR = {eur_rate}, USD = {usd_rate}
- Outstanding Loan: £{loan_remaining} (total loan £{loan_balance}, paid £{loan_paid})
- Active Currency Tracking: {current_to}

You must analyze the user's spoken or typed input and respond in a structured JSON format. 
Your response MUST contain exactly four fields:
1. "speechText": The verbal explanation or reply you will give to the user. Keep it natural, conversational, clear, and relatively brief (1-3 sentences) as it will be spoken aloud.
2. "action": The programmatic action to trigger in the UI. Choose EXACTLY one from:
   - "NAVIGATE_TAB": Switch to a specific tab.
   - "LOCK_RATE": Lock the current rate.
   - "SCHEDULE_TRANSFER": Set up a transfer.
   - "OPTIMIZE_REPAYMENT": Suggest the family routing split.
   - "CHECK_LOAN": Check progress on outstanding loan.
   - "UNKNOWN": For general chat/questions that do not map to a specific action.
3. "targetTab": The DOM id of the tab associated with the action. Choose from:
   - "overview"
   - "emergency"
   - "fx-management"
   - "loan-repayment"
   - "voice-assistant"
   - "p2p-trust"
   - or null if none.
4. "parameters": (Optional) Additional key-value pairs needed for the action:
   - "currency": (e.g. "INR", "AED", "CAD", "EUR")
   - "rate": (e.g. 131.50)
   - "amount": (e.g. 300)

Examples:
- User says: "What is the rupee rate?" -> Action: NAVIGATE_TAB, targetTab: fx-management, parameters: {{ "currency": "INR" }}, speechText: "The GBP to INR exchange rate is currently {inr_rate}. Let's head to the FX core to check."
- User says: "Lock the exchange rate for INR" -> Action: LOCK_RATE, targetTab: fx-management, parameters: {{ "currency": "INR", "rate": {inr_rate} }}, speechText: "Perfect. Locking the GBP to INR exchange rate at {inr_rate} for seven days."
- User says: "Suggest an optimized repayment split" -> Action: OPTIMIZE_REPAYMENT, targetTab: loan-repayment, speechText: "Analyzing market spreads. By splitting the outstanding £{loan_remaining} across active family nodes, you can save on conversion spreads. Let me show you the split."
- User says: "How much loan is left?" -> Action: CHECK_LOAN, targetTab: loan-repayment, speechText: "You have £{loan_remaining} remaining out of £{loan_balance} total. That means you have repaid £{loan_paid} so far."
- User says: "Schedule a transfer of 300 pounds" -> Action: SCHEDULE_TRANSFER, targetTab: fx-management, parameters: {{ "amount": 300 }}, speechText: "Scheduling a transfer of three hundred pounds under optimized family routing. Let's configure the rate trigger."
- User says: "Show my local matching transfers" -> Action: NAVIGATE_TAB, targetTab: p2p-trust, speechText: "Opening your local P2P matching ledger showing how your transfers settle without crossing borders."
- User says: "Check my social trust guarantees" -> Action: NAVIGATE_TAB, targetTab: p2p-trust, speechText: "Opening your Social Trust network showing your active guarantors and micro-guarantees."
- User says: "Hello" -> Action: UNKNOWN, targetTab: null, speechText: "Hello! I am Saan. How can I help you manage your cross-border emergency loans today?"
"""

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        # Fallback response if API key is not configured yet
        return ChatResponse(
            speechText="Gemini API Key is not configured. Falling back to local assistant response parsing.",
            action="UNKNOWN",
            targetTab=None
        )

    # Call Gemini model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload_data = {
        "contents": [{"parts": [{"text": user_msg}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "speechText": {"type": "STRING"},
                    "action": {
                        "type": "STRING",
                        "enum": ["NAVIGATE_TAB", "LOCK_RATE", "SCHEDULE_TRANSFER", "OPTIMIZE_REPAYMENT", "CHECK_LOAN", "UNKNOWN"]
                    },
                    "targetTab": {"type": "STRING"},
                    "parameters": {
                        "type": "OBJECT",
                        "properties": {
                            "currency": {"type": "STRING"},
                            "rate": {"type": "NUMBER"},
                            "amount": {"type": "NUMBER"}
                        }
                    }
                },
                "required": ["speechText", "action", "targetTab"]
            }
        },
        "systemInstruction": {"parts": [{"text": system_prompt}]}
    }

    try {
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload_data, timeout=30.0)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail=f"Gemini API returned an error: {res.text}")
            
            data = res.json()
            response_json = data["candidates"][0]["content"]["parts"][0]["text"]
            
            # Use Pydantic validation
            import json
            parsed = json.loads(response_json)
            return ChatResponse(**parsed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
