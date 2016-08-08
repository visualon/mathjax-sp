$ErrorActionPreference = 'Stop'; # stop on all errors

if ( (Get-PSSnapin -Name Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue) -eq $null )
{
    Add-PsSnapin Microsoft.SharePoint.PowerShell
}

$toolsDir   = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$fld = $env:chocolateyPackageFolder
$url = $null
$local = $false

# Wait for timer job during deploy and retract
function Wait4TimerJob($solution)
{
  $counter = 120
  $sleeptime = 1

  while( ($solution.JobExists -eq $true ) -and ( $counter -gt 0 ) )
  {
   Write-Progress -Activity "Waiting to finish deployment solution timer job" -SecondsRemaining ($counter*$sleeptime)
   Start-Sleep -Seconds $sleeptime
   $counter--
  }

  if($solution.JobExists -eq $true) {
    Write-Progress -Activity "The solution has not been deployed" -Completed
    Write-Host "The solution has not been deployed" -ForegroundColor Red
    return
  }

  Write-Progress -Activity "The solution has been deployed" -Completed
  Write-Host "The solution has been deployed" -ForegroundColor Green
}

function ParseArgs($packageParameters) {
    $arguments = @{}

    # Now parse the packageParameters using good old regular expression
    if ($packageParameters) {
        $match_pattern = "\/(?<option>([a-zA-Z]+)):(?<value>([`"'])?([a-zA-Z0-9- _\\:\.]+)([`"'])?)|\/(?<option>([a-zA-Z]+))"
        $option_name = 'option'
        $value_name = 'value'

        if ($packageParameters -match $match_pattern ){
            $results = $packageParameters | Select-String $match_pattern -AllMatches
            $results.matches | % {
                $arguments.Add(
                    $_.Groups[$option_name].Value.Trim().ToLowerInvariant(),
                    $_.Groups[$value_name].Value.Trim())
            }
        }
        else
        {
            Throw "Package Parameters were found but were invalid (REGEX Failure)"
        }

        if ($arguments.ContainsKey("url")) {
            Write-Host "Url Argument Found"
            $url = $arguments["url"]
        }

        if ($arguments.ContainsKey("local")) {
            Write-Host "local Argument Found"
            $local = $true
        }

    } else {
        Write-Debug "No Package Parameters Passed in"
    }
}

ParseArgs($env:chocolateyPackageParameters)

#$farm = (get-spfarm).BuildVersion.Major
$file = gci $fld -File -Filter "*.wsp" | select -First 1

$sol = Get-SPSolution | ? { $_.Name -eq $file.Name }
if ($sol -ne $null)
{
    "Updating solution " + $file.Name  | Write-Host
    Update-SPSolution $sol -LiteralPath $file.FullName -GACDeployment -Local:$local
}
else
{
     "Installing solution " + $file.Name  | Write-Host
    $sol = Add-SPSolution $file.FullName

    if($sol.ContainsWebApplicationResource)
    {
        if ($url -ne $null)
        {
            Install-SPSolution $sol -GACDeployment -WebApplication $url -Local:$local
        }
        else
        {
            Install-SPSolution $sol -GACDeployment -AllWebApplications -Local:$local
        }
    }
    else
    {
        Install-SPSolution $sol -GACDeployment -Local:$local
    }
}

Wait4TimerJob $sol

if ($sol.LastOperationResult.ToString() -ne "DeploymentSucceeded"){
    Throw $sol.LastOperationDetails
} else {
    $sol.LastOperationDetails | Write-Host
}


