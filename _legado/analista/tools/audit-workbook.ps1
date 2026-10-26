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

function Safe-Text {
    param([object]$Value)
    if ($null -eq $Value) { return '' }
    try { return [string]$Value } catch { return '' }
}

$resolvedInput = [IO.Path]::GetFullPath($InputPath)
$resolvedOutput = [IO.Path]::GetFullPath($OutputPath)
if (-not [IO.File]::Exists($resolvedInput)) {
    throw "Workbook não encontrado: $resolvedInput"
}

$excel = $null
$workbook = $null
$audit = [ordered]@{
    input = $resolvedInput
    auditedAt = (Get-Date).ToString('o')
    workbook = [ordered]@{}
    names = @()
    sheets = @()
}

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.AskToUpdateLinks = $false
    $excel.EnableEvents = $false
    $excel.ScreenUpdating = $false
    $workbook = $excel.Workbooks.Open($resolvedInput, 0, $true)

    $externalLinks = @()
    try {
        $links = $workbook.LinkSources(1)
        if ($null -ne $links) { $externalLinks = @($links | ForEach-Object { Safe-Text $_ }) }
    } catch { $externalLinks = @() }

    $audit.workbook = [ordered]@{
        name = $workbook.Name
        fullName = $workbook.FullName
        fileFormat = $workbook.FileFormat
        calculationVersion = $workbook.CalculationVersion
        worksheets = $workbook.Worksheets.Count
        names = $workbook.Names.Count
        connections = $workbook.Connections.Count
        externalLinks = $externalLinks
        hasVBProject = $workbook.HasVBProject
        readOnly = $workbook.ReadOnly
    }

    foreach ($name in $workbook.Names) {
        $audit.names += [ordered]@{
            name = Safe-Text $name.Name
            refersTo = Safe-Text $name.RefersTo
            visible = $name.Visible
        }
        Release-ComObject $name
    }

    foreach ($sheet in $workbook.Worksheets) {
        $used = $sheet.UsedRange
        $tables = @()
        $charts = @()
        $pivots = @()
        $merges = @{}
        $validations = @()
        $hyperlinks = @()
        $formulas = @()
        $nonEmpty = @()
        $errors = @()

        foreach ($table in $sheet.ListObjects) {
            $tables += [ordered]@{
                name = Safe-Text $table.Name
                displayName = Safe-Text $table.DisplayName
                range = Safe-Text $table.Range.Address($false, $false)
                rows = $table.ListRows.Count
                columns = $table.ListColumns.Count
                sourceType = $table.SourceType
                showTotals = $table.ShowTotals
            }
            Release-ComObject $table
        }

        foreach ($chartObject in $sheet.ChartObjects()) {
            $chart = $chartObject.Chart
            $series = @()
            try {
                foreach ($serie in $chart.SeriesCollection()) {
                    $series += [ordered]@{
                        name = Safe-Text $serie.Name
                        formula = Safe-Text $serie.Formula
                    }
                    Release-ComObject $serie
                }
            } catch {}
            $charts += [ordered]@{
                name = Safe-Text $chartObject.Name
                chartType = $chart.ChartType
                title = $(if ($chart.HasTitle) { Safe-Text $chart.ChartTitle.Text } else { '' })
                left = [math]::Round($chartObject.Left, 2)
                top = [math]::Round($chartObject.Top, 2)
                width = [math]::Round($chartObject.Width, 2)
                height = [math]::Round($chartObject.Height, 2)
                series = $series
            }
            Release-ComObject $chart
            Release-ComObject $chartObject
        }

        try {
            foreach ($pivot in $sheet.PivotTables()) {
                $pivots += [ordered]@{
                    name = Safe-Text $pivot.Name
                    range = Safe-Text $pivot.TableRange2.Address($false, $false)
                    sourceData = Safe-Text $pivot.SourceData
                }
                Release-ComObject $pivot
            }
        } catch {}

        foreach ($link in $sheet.Hyperlinks) {
            $hyperlinks += [ordered]@{
                range = Safe-Text $link.Range.Address($false, $false)
                address = Safe-Text $link.Address
                subAddress = Safe-Text $link.SubAddress
                text = Safe-Text $link.TextToDisplay
            }
            Release-ComObject $link
        }

        $formulaCount = 0
        try {
            $formulaRange = $used.SpecialCells(-4123)
            $formulaCount = $formulaRange.CountLarge
            $capturedFormulaCount = 0
            foreach ($cell in $formulaRange.Cells) {
                $formulas += [ordered]@{
                    address = Safe-Text $cell.Address($false, $false)
                    formula = Safe-Text $cell.Formula
                    formulaLocal = Safe-Text $cell.FormulaLocal
                    value = Safe-Text $cell.Value2
                    text = Safe-Text $cell.Text
                }
                Release-ComObject $cell
                $capturedFormulaCount += 1
                if ($capturedFormulaCount -ge 1500) { break }
            }
            Release-ComObject $formulaRange
        } catch {}

        try {
            $validationRange = $used.SpecialCells(-4174)
            foreach ($area in $validationRange.Areas) {
                $first = $area.Cells.Item(1, 1)
                $validation = $first.Validation
                $validations += [ordered]@{
                    range = Safe-Text $area.Address($false, $false)
                    type = $validation.Type
                    alertStyle = $validation.AlertStyle
                    operator = $validation.Operator
                    formula1 = Safe-Text $validation.Formula1
                    formula2 = Safe-Text $validation.Formula2
                    inputTitle = Safe-Text $validation.InputTitle
                    inputMessage = Safe-Text $validation.InputMessage
                    errorTitle = Safe-Text $validation.ErrorTitle
                    errorMessage = Safe-Text $validation.ErrorMessage
                }
                Release-ComObject $validation
                Release-ComObject $first
                Release-ComObject $area
            }
            Release-ComObject $validationRange
        } catch {}

        try {
            $constantRange = $used.SpecialCells(2)
            $capturedConstantCount = 0
            foreach ($cell in $constantRange.Cells) {
                try {
                    $value = $cell.Value2
                    $nonEmpty += [ordered]@{
                        address = Safe-Text $cell.Address($false, $false)
                        value = Safe-Text $value
                        text = Safe-Text $cell.Text
                        formula = ''
                    }
                    if ($cell.MergeCells) {
                        $merge = $cell.MergeArea
                        $mergeAddress = Safe-Text $merge.Address($false, $false)
                        $merges[$mergeAddress] = $true
                        Release-ComObject $merge
                    }
                    $capturedConstantCount += 1
                    if ($capturedConstantCount -ge 600) { break }
                } finally {
                    Release-ComObject $cell
                }
            }
            Release-ComObject $constantRange
        } catch {}

        if (($used.Rows.Count * $used.Columns.Count) -le 30000) {
            foreach ($cell in $used.Cells) {
                try {
                    if ($cell.MergeCells) {
                        $merge = $cell.MergeArea
                        $mergeAddress = Safe-Text $merge.Address($false, $false)
                        $merges[$mergeAddress] = $true
                        Release-ComObject $merge
                    }
                } finally {
                    Release-ComObject $cell
                }
            }
        }

        foreach ($errorType in @(@(-4123, 16), @(2, 16))) {
            try {
                $errorRange = $used.SpecialCells($errorType[0], $errorType[1])
                foreach ($cell in $errorRange.Cells) {
                    $errors += [ordered]@{
                        address = Safe-Text $cell.Address($false, $false)
                        text = Safe-Text $cell.Text
                        formula = $(if ($cell.HasFormula) { Safe-Text $cell.Formula } else { '' })
                    }
                    Release-ComObject $cell
                }
                Release-ComObject $errorRange
            } catch {}
        }

        $sheetAudit = [ordered]@{
            name = $sheet.Name
            codeName = $sheet.CodeName
            index = $sheet.Index
            visible = $sheet.Visible
            protected = $sheet.ProtectContents
            usedRange = Safe-Text $used.Address($false, $false)
            usedRows = $used.Rows.Count
            usedColumns = $used.Columns.Count
            freezePanes = $sheet.Application.ActiveWindow.FreezePanes
            shapes = $sheet.Shapes.Count
            conditionalFormats = $used.FormatConditions.Count
            tables = $tables
            charts = $charts
            pivots = $pivots
            mergedRanges = @($merges.Keys | Sort-Object)
            validations = $validations
            hyperlinks = $hyperlinks
            formulas = $formulas
            formulaCount = $formulaCount
            formulaSampleTruncated = ($formulaCount -gt $formulas.Count)
            nonEmptySample = $nonEmpty
            detectedErrors = $errors
        }
        $audit.sheets += $sheetAudit

        Release-ComObject $used
        Release-ComObject $sheet
    }

    $outputDirectory = [IO.Path]::GetDirectoryName($resolvedOutput)
    if (-not [IO.Directory]::Exists($outputDirectory)) {
        [IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
    }
    $audit | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $resolvedOutput -Encoding UTF8
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
