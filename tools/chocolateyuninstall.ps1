$ErrorActionPreference = 'Stop'; # stop on all errors

if ( (Get-PSSnapin -Name Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue) -eq $null )
{
    Add-PsSnapin Microsoft.SharePoint.PowerShell
}

$file = gci $fld -File -Filter "*.wsp" | select -First 1

$sol = Get-SPSolution | ? { $_.Name -eq $file.Name }
if ($sol -ne $null)
{
    #Uninstall-SPSolution $sol -AllWebApplications -Local
    #$sol.LastOperationDetails | Write-Host -ForegroundColor Yellow
    #Remove-SPSolution $sol

    "You have to manually uninstall the solution: " + $file.Name | Write-Host -ForegroundColor Yellow
}
else
{
    "Solution already uninstalled" | Write-Host -ForegroundColor Green
}
