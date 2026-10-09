param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

function Release-ComObject {
    param([object]$Object)
    if ($null -ne $Object -and [Runtime.InteropServices.Marshal]::IsComObject($Object)) {
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($Object)
    }
}

$rangeSpecs = @(
    [pscustomobject]@{ Index = 2; Ranges = @('A1:O55') },
    [pscustomobject]@{ Index = 4; Ranges = @('B1:AL14') },
    [pscustomobject]@{ Index = 5; Ranges = @('A2:P30', 'A31:P45') },
    [pscustomobject]@{ Index = 8; Ranges = @('A2:N18') },
    [pscustomobject]@{ Index = 9; Ranges = @('A2:O18') },
    [pscustomobject]@{ Index = 10; Ranges = @('B2:Q18') },
    [pscustomobject]@{ Index = 12; Ranges = @('A2:N18') },
    [pscustomobject]@{ Index = 13; Ranges = @('A2:V18') },
    [pscustomobject]@{ Index = 15; Ranges = @('A1:J80') },
    [pscustomobject]@{ Index = 16; Ranges = @('A2:BK20') },
    [pscustomobject]@{ Index = 3; Ranges = @('A80:F96') }
)

$resolvedInput = [IO.Path]::GetFullPath($InputPath)
$resolvedOutput = [IO.Path]::GetFullPath($OutputPath)
$excel = $null
$workbook = $null
$result = [ordered]@{}

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.AskToUpdateLinks = $false
    $excel.EnableEvents = $false
    $workbook = $excel.Workbooks.Open($resolvedInput, 0, $true)

    foreach ($spec in $rangeSpecs) {
        $sheet = $workbook.Worksheets.Item($spec.Index)
        $sheetName = [string]$sheet.Name
        Write-Output ("Lendo: " + $sheetName)
        $sheetResult = @()
        foreach ($rangeAddress in $spec.Ranges) {
            $range = $sheet.Range($rangeAddress)
            $cells = @()
            foreach ($cell in $range.Cells) {
                try {
                    $value = $cell.Value2
                    $formula = $(if ($cell.HasFormula) { [string]$cell.Formula } else { '' })
                    if (($null -ne $value -and [string]$value -ne '') -or $formula) {
                        $cells += [ordered]@{
                            address = [string]$cell.Address($false, $false)
                            value = $(if ($null -eq $value) { '' } else { [string]$value })
                            text = [string]$cell.Text
                            formula = $formula
                            numberFormat = [string]$cell.NumberFormat
                        }
                    }
                } finally {
                    Release-ComObject $cell
                }
            }
            $sheetResult += [ordered]@{
                range = $rangeAddress
                cells = $cells
            }
            Release-ComObject $range
        }
        $result[$sheetName] = $sheetResult
        Release-ComObject $sheet
    }

    $directory = [IO.Path]::GetDirectoryName($resolvedOutput)
    if (-not [IO.Directory]::Exists($directory)) {
        [IO.Directory]::CreateDirectory($directory) | Out-Null
    }
    $result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $resolvedOutput -Encoding UTF8
}
finally {
    if ($null -ne $workbook) {
        $workbook.Close($false)
        Release-ComObject $workbook
    }
    if ($null -ne $excel) {
        $excel.Quit()
        Release-ComObject $excel
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Output $resolvedOutput
