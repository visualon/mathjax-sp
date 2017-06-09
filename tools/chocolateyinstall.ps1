$ErrorActionPreference = 'Stop'; # stop on all errors

if ( (Get-PSSnapin -Name Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue) -eq $null ) {
    Add-PsSnapin Microsoft.SharePoint.PowerShell
}

$fld = $env:chocolateyPackageFolder
$url = $null
$local = $false

# Wait for timer job during deploy and retract
function Wait4TimerJob($solution) {
    $counter = 240
    $sleeptime = 1

    while ( ($solution.JobExists -eq $true ) -and ( $counter -gt 0 ) ) {
        Write-Progress -Activity "Waiting to finish deployment solution timer job" -SecondsRemaining ($counter * $sleeptime)
        Start-Sleep -Seconds $sleeptime
        $counter--
    }

    if ($solution.JobExists -eq $true) {
        Write-Progress -Activity "The solution has not been deployed" -Completed
        Write-Host "The solution has not been deployed" -ForegroundColor Red
        return
    }

    Write-Progress -Activity "The solution has been deployed" -Completed
    Write-Host "The solution has been deployed" -ForegroundColor Green
}

$arguments = Get-PackageParameters

if ($arguments.ContainsKey("url")) {
    Write-Host ("Url Argument Found: " + $arguments["url"])
    $url = $arguments["url"]
}

if ($arguments.ContainsKey("local")) {
    Write-Host "local Argument Found"
    $local = $true
}

$file = Get-ChildItem $fld -File -Filter "*.wsp" | Select-Object -First 1

$sol = Get-SPSolution | Where-Object { $_.Name -eq $file.Name }
if ($sol -ne $null) {
    "Updating solution " + $file.Name  | Write-Host
    Update-SPSolution $sol -LiteralPath $file.FullName -GACDeployment -Local:$local
}
else {
    "Installing solution " + $file.Name  | Write-Host
    $sol = Add-SPSolution $file.FullName

    if ($sol.ContainsWebApplicationResource) {
        if ($url -ne $null) {
            Install-SPSolution $sol -GACDeployment -WebApplication $url -Local:$local
        }
        else {
            Install-SPSolution $sol -GACDeployment -AllWebApplications -Local:$local
        }
    }
    else {
        Install-SPSolution $sol -GACDeployment -Local:$local
    }
}

Wait4TimerJob $sol

if ($sol.LastOperationResult.ToString() -ne "DeploymentSucceeded") {
    Throw $sol.LastOperationDetails
}
else {
    $sol.LastOperationDetails | Write-Host
}


