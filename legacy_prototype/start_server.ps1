$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

# Load environment variables from .env if it exists
$envFile = Join-Path -Path $PSScriptRoot -ChildPath ".env"
$geminiApiKey = ""
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*GEMINI_API_KEY\s*=\s*(.*)") {
            $geminiApiKey = $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
}
if ([string]::IsNullOrEmpty($geminiApiKey)) {
    $geminiApiKey = [System.Environment]::GetEnvironmentVariable("GEMINI_API_KEY")
}

try {
    $listener.Start()
    Write-Output "Saan Voice local prototype server running at: http://localhost:$port/"
    Write-Output "To stop the server, cancel this task in the terminal or press Ctrl+C."
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Route path detection
        $urlPath = $request.Url.LocalPath
        
        # Handle API Proxy endpoint
        if ($request.HttpMethod -eq "POST" -and $urlPath -eq "/api/chat") {
            $response.ContentType = "application/json"
            
            # Read client request payload
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $requestBody = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                if ([string]::IsNullOrEmpty($geminiApiKey)) {
                    throw "Gemini API key is not configured. Please create a .env file containing GEMINI_API_KEY=your_key."
                }
                
                $clientPayload = ConvertFrom-Json $requestBody
                $userMsg = $clientPayload.message
                $appState = $clientPayload.state
                
                # Fetch state details with defaults
                $gbpRate = 1.0
                if ($appState.rates.GBP) { $gbpRate = [double]$appState.rates.GBP }
                $inrRate = 131.50
                if ($appState.rates.INR) { $inrRate = [double]$appState.rates.INR }
                $aedRate = 4.67
                if ($appState.rates.AED) { $aedRate = [double]$appState.rates.AED }
                $cadRate = 1.74
                if ($appState.rates.CAD) { $cadRate = [double]$appState.rates.CAD }
                $eurRate = 1.18
                if ($appState.rates.EUR) { $eurRate = [double]$appState.rates.EUR }
                $usdRate = 1.27
                if ($appState.rates.USD) { $usdRate = [double]$appState.rates.USD }
                
                $loanBalance = 300.00
                if ($appState.loanBalance) { $loanBalance = [double]$appState.loanBalance }
                $loanPaid = 216.00
                if ($appState.loanPaid) { $loanPaid = [double]$appState.loanPaid }
                $loanRemaining = $loanBalance - $loanPaid
                
                $currentFrom = "GBP"
                if ($appState.currentFrom) { $currentFrom = $appState.currentFrom }
                $currentTo = "INR"
                if ($appState.currentTo) { $currentTo = $appState.currentTo }
                
                $activeRate = 1.0
                $targetProp = $currentTo
                if ($appState.rates.$targetProp) { 
                    $activeRate = [double]$appState.rates.$targetProp 
                }
                
                # Dynamic instructions based on current client state
                $systemPrompt = @"
You are Saan AI, an intelligent voice-activated financial assistant. You help Rushi (a borrower based in the UK) with emergency funding and collaborative cross-border repayments.

The current dashboard state is:
- Chosen "From" base currency: $currentFrom
- Chosen "To" target currency: $currentTo
- Current active FX Rate: 1 $currentFrom = $activeRate $currentTo
- Current FX Rates relative to ${currentFrom}: GBP = $gbpRate, INR = $inrRate, AED = $aedRate, CAD = $cadRate, EUR = $eurRate, USD = $usdRate
- Outstanding Loan: £$loanRemaining (total loan £$loanBalance, paid £$loanPaid)
- Active Currency Tracking: $currentTo

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
   - or null/empty if none.
4. "parameters": (Optional) Additional key-value pairs needed for the action:
   - "currency": (e.g. "INR", "AED", "CAD", "EUR")
   - "rate": (e.g. 131.50)
   - "amount": (e.g. 300)

Examples:
- User says: "What is the rupee rate?" -> Action: NAVIGATE_TAB, targetTab: fx-management, parameters: { "currency": "INR" }, speechText: "The GBP to INR exchange rate is currently $inrRate. Let's head to the FX core to check."
- User says: "Lock the exchange rate for INR" -> Action: LOCK_RATE, targetTab: fx-management, parameters: { "currency": "INR", "rate": $inrRate }, speechText: "Perfect. Locking the GBP to INR exchange rate at $inrRate for seven days."
- User says: "Suggest an optimized repayment split" -> Action: OPTIMIZE_REPAYMENT, targetTab: loan-repayment, speechText: "Analyzing market spreads. By splitting the outstanding £$loanRemaining across active family nodes, you can save on conversion spreads. Let me show you the split."
- User says: "How much loan is left?" -> Action: CHECK_LOAN, targetTab: loan-repayment, speechText: "You have £$loanRemaining remaining out of £$loanBalance total. That means you have repaid $loanPaid so far."
- User says: "Schedule a transfer of 500 pounds" -> Action: SCHEDULE_TRANSFER, targetTab: fx-management, parameters: { "amount": 500 }, speechText: "Scheduling a transfer of five hundred pounds under optimized family routing. Let's configure the rate trigger."
- User says: "Hello" -> Action: UNKNOWN, targetTab: null, speechText: "Hello! I am Saan. How can I help you manage your cross-border emergency loans today?"
"@

                # Build Gemini API Payload
                $geminiPayload = @{
                    contents = @(
                        @{
                            parts = @(
                                @{ text = $userMsg }
                            )
                        }
                    )
                    generationConfig = @{
                        responseMimeType = "application/json"
                        responseSchema = @{
                            type = "OBJECT"
                            properties = @{
                                speechText = @{ type = "STRING" }
                                action = @{ 
                                    type = "STRING"
                                    enum = @("NAVIGATE_TAB", "LOCK_RATE", "SCHEDULE_TRANSFER", "OPTIMIZE_REPAYMENT", "CHECK_LOAN", "UNKNOWN")
                                }
                                targetTab = @{ type = "STRING" }
                                parameters = @{
                                    type = "OBJECT"
                                    properties = @{
                                        currency = @{ type = "STRING" }
                                        rate = @{ type = "NUMBER" }
                                        amount = @{ type = "NUMBER" }
                                    }
                                }
                            }
                            required = @("speechText", "action", "targetTab")
                        }
                    }
                    systemInstruction = @{
                        parts = @(
                            @{ text = $systemPrompt }
                        )
                    }
                }
                
                $bodyJson = ConvertTo-Json $geminiPayload -Depth 10
                
                # Make HTTP POST to Google Gemini API
                $uri = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$geminiApiKey"
                
                $ProgressPreference = 'SilentlyContinue'
                $apiResult = Invoke-RestMethod -Uri $uri -Method Post -Body $bodyJson -ContentType "application/json"
                
                $responseText = $apiResult.candidates[0].content.parts[0].text
                
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes($responseText)
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            } catch {
                $response.StatusCode = 500
                $errMsg = $_.Exception.Message
                if ([string]::IsNullOrEmpty($errMsg)) { $errMsg = $_.ToString() }
                
                $errorPayload = @{
                    error = $true
                    message = $errMsg
                } | ConvertTo-Json
                
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes($errorPayload)
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            }
            
            $response.OutputStream.Close()
            continue
        }
        
        # Default route to user.html
        if ($urlPath -eq "/" -or $urlPath -eq "") {
            $urlPath = "/user.html"
        }
        
        $filePath = Join-Path -Path $PSScriptRoot -ChildPath $urlPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Content Type detection
            if ($filePath.EndsWith(".html")) {
                $response.ContentType = "text/html"
            } elseif ($filePath.EndsWith(".js")) {
                $response.ContentType = "application/javascript"
            } elseif ($filePath.EndsWith(".css")) {
                $response.ContentType = "text/css"
            }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    }
} catch {
    Write-Error "Server error: $_"
} finally {
    $listener.Close()
}
