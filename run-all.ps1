# run-all.ps1
# This script launches multiple development processes for Go-Together
# Usage: .\run-all.ps1 [service_number]
# Example: .\run-all.ps1 1   (runs only MongoDB)

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

# Parse arguments
$ServiceNumber = 0
$clr_ports = $false

if ($Args.Count -gt 0) {
    if ($Args[0] -eq "--clr_ports") {
        $clr_ports = $true
    } elseif ($Args[0] -as [int]) {
        $ServiceNumber = [int]$Args[0]
    }
}

# Helper to kill processes on specific ports
function Clear-Ports {
    $ports = @(3000, 5000, 8000)
    Write-Host "Clearing ports: $($ports -join ', ')..." -ForegroundColor Yellow
    
    foreach ($port in $ports) {
        try {
            $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Select-Object -First 1
            if ($process) {
                Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
                Write-Host "Killed process on port $port (PID: $process)" -ForegroundColor Green
            } else {
                Write-Host "No process found on port $port" -ForegroundColor Gray
            }
        } catch {
            Write-Host "Error clearing port $port : $_" -ForegroundColor Red
        }
    }
    Write-Host "Ports cleared!" -ForegroundColor Green
}

# Helper to open a new PowerShell window and run a command
function Start-NewTerminal($cmd, $title) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $(Get-Location); Write-Host '[$title]' -ForegroundColor Cyan; $cmd"
}

# Define services array
$services = @(
    @{number = 1; cmd = 'mongod --dbpath "C:\db_data\db"'; title = "MongoDB"},
    @{number = 2; cmd = 'cd "C:\VSCode\go-together\server"; npm run dev'; title = "Server"},
    @{number = 3; cmd = 'cd "C:\VSCode\go-together\client"; npm run start'; title = "Client"},
    @{number = 4; cmd = 'cd "C:\VSCode\go-together\mobile_client"; npx expo start --clear --tunnel'; title = "MobileClient"},
    @{number = 5; cmd = 'cd "C:\VSCode\go-together\server\src\scripts"; node .\debugMenu.js'; title = "DebugMenu"},
    @{number = 6; cmd = 'cd "C:\VSCode\go-together\mobile_client\scripts"; node .\updateNgrokUrl.js; exit'; title = "NgrokUpdater"}
)

# If no service number specified, run all
if ($clr_ports) {
    Clear-Ports
    exit
}

if ($ServiceNumber -eq 0) {
    Write-Host "Starting all services..." -ForegroundColor Green
    foreach ($service in $services) {
        Start-NewTerminal $service.cmd $service.title
        Start-Sleep -Milliseconds 500
    }
} else {
    # Run only the specified service
    $selectedService = $services | Where-Object { $_.number -eq $ServiceNumber }
    if ($selectedService) {
        Write-Host "Starting service number $($ServiceNumber): $($selectedService.title)..." -ForegroundColor Green
        Start-NewTerminal $selectedService.cmd $selectedService.title
    } else {
        Write-Host "Error: Service number $($ServiceNumber) not found. Valid options are 1-6." -ForegroundColor Red
    }
}