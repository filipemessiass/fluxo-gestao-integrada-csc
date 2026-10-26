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

function OleColor {
    param([string]$Hex)
    $clean = $Hex.TrimStart('#')
    $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)
    return $r + ($g * 256) + ($b * 65536)
}

$colors = @{
    Accent = OleColor '#0022F4'
    Accent2 = OleColor '#0000FF'
    Dark = OleColor '#0B1220'
    Ink = OleColor '#111827'
    Muted = OleColor '#5F6673'
    White = OleColor '#FFFFFF'
    Surface = OleColor '#F6F8FB'
    Border = OleColor '#E5E7EB'
    BlueSoft = OleColor '#EEF1FF'
    Green = OleColor '#16A34A'
    GreenSoft = OleColor '#ECFDF3'
    Amber = OleColor '#F59E0B'
    AmberSoft = OleColor '#FFFBEB'
    Red = OleColor '#DC2626'
    RedSoft = OleColor '#FFF1F2'
    Violet = OleColor '#7C3AED'
}

function Set-Text {
    param([object]$Sheet, [string]$Address, [object]$Value)
    $range = $Sheet.Range($Address)
    $range.Value2 = $Value
    Release-ComObject $range
}

function Set-Formula {
    param([object]$Sheet, [string]$Address, [string]$Formula)
    $range = $Sheet.Range($Address)
    $range.Formula = $Formula
    Release-ComObject $range
}

function Merge-Cells {
    param([object]$Sheet, [string]$Address)
    $range = $Sheet.Range($Address)
    $range.Merge() | Out-Null
    Release-ComObject $range
}

function Style-Range {
    param(
        [object]$Sheet,
        [string]$Address,
        [Nullable[int]]$Fill,
        [Nullable[int]]$FontColor,
        [double]$FontSize = 10,
        [bool]$Bold = $false,
        [int]$Horizontal = -4131,
        [int]$Vertical = -4108,
        [bool]$Wrap = $false
    )
    $range = $Sheet.Range($Address)
    if ($null -ne $Fill) { $range.Interior.Color = [int]$Fill }
    if ($null -ne $FontColor) { $range.Font.Color = [int]$FontColor }
    $range.Font.Name = 'Calibri'
    $range.Font.Size = $FontSize
    $range.Font.Bold = $Bold
    $range.HorizontalAlignment = $Horizontal
    $range.VerticalAlignment = $Vertical
    $range.WrapText = $Wrap
    Release-ComObject $range
}

function Add-Outline {
    param([object]$Sheet, [string]$Address, [int]$Color, [int]$Weight = 2)
    $range = $Sheet.Range($Address)
    foreach ($edge in @(7, 8, 9, 10)) {
        $border = $range.Borders.Item($edge)
        $border.LineStyle = 1
        $border.Color = $Color
        $border.Weight = $Weight
        Release-ComObject $border
    }
    Release-ComObject $range
}

function Add-Comment {
    param([object]$Sheet, [string]$Address, [string]$Text)
    $cell = $Sheet.Range($Address)
    try {
        if ($null -ne $cell.Comment) { $cell.Comment.Delete() }
    } catch {}
    $comment = $cell.AddComment($Text)
    try {
        $comment.Shape.Width = 280
        $comment.Shape.Height = 110
    } catch {}
    Release-ComObject $comment
    Release-ComObject $cell
}

function Add-ExpressionFormat {
    param([object]$Sheet, [string]$Address, [string]$Formula, [int]$Fill, [int]$FontColor)
    $range = $Sheet.Range($Address)
    $condition = $range.FormatConditions.Add(2, 0, $Formula)
    $condition.Interior.Color = $Fill
    $condition.Font.Color = $FontColor
    Release-ComObject $condition
    Release-ComObject $range
}

function Style-SectionHeader {
    param([object]$Sheet, [int]$Row, [string]$Title)
    $address = "A${Row}:Q${Row}"
    Merge-Cells $Sheet $address
    Set-Text $Sheet "A$Row" $Title
    Style-Range $Sheet $address $colors.Accent $colors.White 11 $true -4131 -4108 $false
    $Sheet.Rows.Item($Row).RowHeight = 24
}

function Style-TableHeader {
    param([object]$Sheet, [string]$Address)
    Style-Range $Sheet $Address $colors.Accent $colors.White 9 $true -4108 -4108 $true
    $range = $Sheet.Range($Address)
    $range.Borders.LineStyle = 1
    $range.Borders.Color = $colors.White
    Release-ComObject $range
}

function Style-Card {
    param([object]$Sheet, [string]$LabelAddress, [string]$ValueAddress, [int]$Tone)
    Style-Range $Sheet $LabelAddress $Tone $colors.Muted 9 $true -4108 -4108 $true
    Style-Range $Sheet $ValueAddress $Tone $colors.Ink 22 $true -4108 -4108 $true
    Add-Outline $Sheet ($LabelAddress.Split(':')[0] + ':' + $ValueAddress.Split(':')[-1]) $colors.Border 2
}

$resolvedInput = [IO.Path]::GetFullPath($InputPath)
$resolvedOutput = [IO.Path]::GetFullPath($OutputPath)
if (-not [IO.File]::Exists($resolvedInput)) {
    throw "Workbook de origem não encontrado: $resolvedInput"
}
if ($resolvedInput -eq $resolvedOutput) {
    throw 'A entrega deve usar um arquivo diferente do original.'
}

$outputDirectory = [IO.Path]::GetDirectoryName($resolvedOutput)
if (-not [IO.Directory]::Exists($outputDirectory)) {
    [IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
}
[IO.File]::Copy($resolvedInput, $resolvedOutput, $true)

$excel = $null
$workbook = $null
$sheet = $null

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.AskToUpdateLinks = $false
    $excel.EnableEvents = $false
    $excel.ScreenUpdating = $false
    $workbook = $excel.Workbooks.Open($resolvedOutput, 0, $false)
    try { $excel.Calculation = -4105 } catch { }

    # Expande as tabelas operacionais para a mesma capacidade da Base Mestre.
    $stageValidationRanges = @{
        6 = @([pscustomobject]@{ Source = 'D207:L207'; Target = 'D208:L1006' })
        7 = @([pscustomobject]@{ Source = 'D207:L207'; Target = 'D208:L1006' })
        8 = @([pscustomobject]@{ Source = 'E207:I207'; Target = 'E208:I1006' })
        9 = @([pscustomobject]@{ Source = 'E207:K207'; Target = 'E208:K1006' })
        10 = @(
            [pscustomobject]@{ Source = 'E207:I207'; Target = 'E208:I1006' }
            [pscustomobject]@{ Source = 'K207:K207'; Target = 'K208:K1006' }
        )
        11 = @([pscustomobject]@{ Source = 'E207:J207'; Target = 'E208:J1006' })
        12 = @([pscustomobject]@{ Source = 'E207:H207'; Target = 'E208:H1006' })
        13 = @(
            [pscustomobject]@{ Source = 'E207:J207'; Target = 'E208:J1006' }
            [pscustomobject]@{ Source = 'N207:N207'; Target = 'N208:N1006' }
            [pscustomobject]@{ Source = 'P207:P207'; Target = 'P208:P1006' }
            [pscustomobject]@{ Source = 'R207:R207'; Target = 'R208:R1006' }
        )
    }

    foreach ($sheetIndex in 6..13) {
        $stageSheet = $workbook.Worksheets.Item($sheetIndex)
        $table = $stageSheet.ListObjects.Item(1)
        $topLeft = $table.Range.Cells.Item(1, 1)
        $lastColumn = $topLeft.Column + $table.Range.Columns.Count - 1
        $bottomRight = $stageSheet.Cells.Item(1006, $lastColumn)
        $newRange = $stageSheet.Range($topLeft, $bottomRight)
        $table.Resize($newRange)

        foreach ($column in $table.ListColumns) {
            $dataRange = $column.DataBodyRange
            $firstCell = $dataRange.Cells.Item(1, 1)
            if ($firstCell.HasFormula) {
                $dataRange.FormulaR1C1 = $firstCell.FormulaR1C1
            }
            Release-ComObject $firstCell
            Release-ComObject $dataRange
            Release-ComObject $column
        }

        foreach ($pair in $stageValidationRanges[$sheetIndex]) {
            $source = $stageSheet.Range($pair.Source)
            $target = $stageSheet.Range($pair.Target)
            $source.Copy() | Out-Null
            $target.PasteSpecial(6) | Out-Null
            Release-ComObject $source
            Release-ComObject $target
        }

        Release-ComObject $newRange
        Release-ComObject $bottomRight
        Release-ComObject $topLeft
        Release-ComObject $table
        Release-ComObject $stageSheet
    }
    # Expande o Tracker para 999 linhas, preservando a regra oficial de etapa/status.
    $tracker = $workbook.Worksheets.Item(5)
    $tracker.Range('B225:P225').Copy() | Out-Null
    $tracker.Range('B226:P1024').PasteSpecial(-4122) | Out-Null
    $tracker.Range('B225:N1024').FillDown()
    $tracker.Range('D11').Formula = '=COUNTIF($M$26:$M$1024,B11)'
    $tracker.Range('D11:D19').FillDown()
    $tracker.Range('D20').Formula = '=COUNTIF($E$26:$L$1024,"Bloqueado")'
    $tracker.Range('D21').Formula = '=COUNTIFS($B$26:$B$1024,"?*",$G$26:$G$1024,"<>Concluído")'
    $tracker.Range('D22').Formula = '=COUNTIFS($B$26:$B$1024,"?*",$I$26:$I$1024,"<>Concluído")'
    Release-ComObject $tracker

    $sheet = $workbook.Worksheets.Item(2)
    try { $sheet.Unprotect() } catch {}

    for ($shapeIndex = $sheet.Shapes.Count; $shapeIndex -ge 1; $shapeIndex -= 1) {
        $shape = $sheet.Shapes.Item($shapeIndex)
        $shape.Delete()
        Release-ComObject $shape
    }
    $sheet.Cells.Clear()

    # Estrutura geral, tipografia e impressão.
    $visible = $sheet.Range('A1:Q95')
    $visible.Interior.Color = $colors.White
    $visible.Font.Name = 'Calibri'
    $visible.Font.Size = 10
    $visible.Font.Color = $colors.Ink
    $visible.VerticalAlignment = -4108
    Release-ComObject $visible

    $sheet.Columns.Item('A').ColumnWidth = 10
    foreach ($columnName in @('B','C','D','E','F','G','H','I','J','K')) { $sheet.Columns.Item($columnName).ColumnWidth = 12 }
    foreach ($columnName in @('L','M','N','O','P')) { $sheet.Columns.Item($columnName).ColumnWidth = 11 }
    $sheet.Columns.Item('Q').ColumnWidth = 9
    $sheet.Range('1:95').RowHeight = 18

    # Cabeçalho institucional.
    Style-Range $sheet 'A1:Q1' $colors.Accent $colors.White 2 $false -4108 -4108 $false
    $sheet.Rows.Item(1).RowHeight = 5
    Merge-Cells $sheet 'A2:L2'
    Merge-Cells $sheet 'M2:Q2'
    Merge-Cells $sheet 'A3:Q3'
    Set-Text $sheet 'A2' 'PROCESSOS INTEGRADOS | PORTFÓLIO EXECUTIVO'
    Set-Formula $sheet 'M2' '="Referência disponível: "&Capa!D57'
    Set-Text $sheet 'A3' 'Posição acumulada e atual do portfólio · fontes oficiais: Lançamentos, Tracker E1–E08, E08/Hypercare e Cadastros'
    Style-Range $sheet 'A2:Q2' $colors.Dark $colors.White 16 $true -4131 -4108 $true
    Style-Range $sheet 'M2:Q2' $colors.Dark $colors.White 8 $false -4152 -4108 $true
    Style-Range $sheet 'A3:Q3' $colors.Dark $colors.White 9 $false -4131 -4108 $true
    $sheet.Rows.Item(2).RowHeight = 29
    $sheet.Rows.Item(3).RowHeight = 22

    # BLOCO 1 — SINAL EXECUTIVO.
    Merge-Cells $sheet 'A5:D5'
    Merge-Cells $sheet 'A6:D8'
    Merge-Cells $sheet 'E5:Q5'
    Merge-Cells $sheet 'E6:H6'
    Merge-Cells $sheet 'E7:H8'
    Merge-Cells $sheet 'I6:L6'
    Merge-Cells $sheet 'I7:L8'
    Merge-Cells $sheet 'M6:Q6'
    Merge-Cells $sheet 'M7:Q8'
    Merge-Cells $sheet 'A9:Q9'
    Set-Text $sheet 'A5' 'BLOCO 1 · STATUS DO PORTFÓLIO'
    Set-Formula $sheet 'A6' '=IF(OR(COUNTIF($AN$2:$AN$1000,"Bloqueado")>0,COUNTIF($BH$2:$BH$1000,"🔴 Hypercare Atrasado")>0,SUM($BK$2:$BK$1000)>0),"CRÍTICO",IF(SUM($AO$2:$AO$1000)>0,"ACOMPANHAR","ESTÁVEL"))'
    Set-Formula $sheet 'E5' '=SUM($AO$2:$AO$1000)&" demandas abertas | "&COUNTIF($AN$2:$AN$1000,"Bloqueado")&" bloqueadas | "&COUNTIF($BH$2:$BH$1000,"🔴 Hypercare Atrasado")&" Hypercares atrasados | "&SUM($BK$2:$BK$1000)&" incidentes críticos"'
    Set-Text $sheet 'E6' 'MAIOR IMPACTO'
    Set-Formula $sheet 'E7' '=IF(COUNT($AU$2:$AU$1000)=0,"Sem ganho mensurado",INDEX($AB$2:$AB$1000,MATCH(MAX($AU$2:$AU$1000),$AU$2:$AU$1000,0))&CHAR(10)&INDEX($AC$2:$AC$1000,MATCH(MAX($AU$2:$AU$1000),$AU$2:$AU$1000,0))&" | +"&TEXT(MAX($AU$2:$AU$1000),"#,##0.0")&" h/mês")'
    Set-Text $sheet 'I6' 'CAPACIDADE LIBERADA'
    Set-Formula $sheet 'I7' '=IF(COUNT($AU$2:$AU$1000)=0,"Sem medição",TEXT(SUM($AU$2:$AU$1000),"#,##0.0")&" h/mês"&CHAR(10)&TEXT(SUM($AU$2:$AU$1000)*12,"#,##0.0")&" h/ano")'
    Set-Text $sheet 'M6' 'DEMANDA ABERTA MAIS ANTIGA'
    Set-Formula $sheet 'M7' '=IF(SUM($AO$2:$AO$1000)=0,"Nenhuma demanda aberta",INDEX($AA$2:$AA$1000,MATCH(MAX($BW$2:$BW$1000),$BW$2:$BW$1000,0))&" | "&INDEX($AB$2:$AB$1000,MATCH(MAX($BW$2:$BW$1000),$BW$2:$BW$1000,0))&CHAR(10)&IFERROR(INDEX($AP$2:$AP$1000,MATCH(MAX($BW$2:$BW$1000),$BW$2:$BW$1000,0))&" dias","sem Data Início")&" | "&SUM($BV$2:$BV$1000)&" crítica(s)")'
    Set-Formula $sheet 'A9' '=IF(COUNTIF($AA$2:$AA$1000,"?*")=0,"Carteira sem dados.",TEXT(COUNTIF($AN$2:$AN$1000,"Concluído")/COUNTIF($AA$2:$AA$1000,"?*"),"0,0%")&" da carteira está concluída. "&IF(SUM($BV$2:$BV$1000)=0,"Não existem demandas em condição crítica.","Existem "&SUM($BV$2:$BV$1000)&" demandas em condição crítica."))'
    Style-Range $sheet 'A5:D5' $colors.Dark $colors.White 9 $true -4108 -4108 $true
    Style-Range $sheet 'A6:D8' $colors.BlueSoft $colors.Accent 20 $true -4108 -4108 $true
    Style-Range $sheet 'E5:Q5' $colors.Surface $colors.Ink 10 $true -4131 -4108 $true
    foreach ($address in @('E6:H6','I6:L6','M6:Q6')) { Style-Range $sheet $address $colors.Surface $colors.Muted 8 $true -4108 -4108 $true }
    foreach ($address in @('E7:H8','I7:L8','M7:Q8')) { Style-Range $sheet $address $colors.White $colors.Ink 11 $true -4108 -4108 $true; Add-Outline $sheet $address $colors.Border 2 }
    Style-Range $sheet 'A9:Q9' $colors.BlueSoft $colors.Accent 10 $true -4131 -4108 $true
    Add-ExpressionFormat $sheet 'A6:D8' '=$A$6="CRÍTICO"' $colors.RedSoft $colors.Red
    Add-ExpressionFormat $sheet 'A6:D8' '=$A$6="ACOMPANHAR"' $colors.AmberSoft $colors.Amber
    Add-ExpressionFormat $sheet 'A6:D8' '=$A$6="ESTÁVEL"' $colors.GreenSoft $colors.Green
    $sheet.Range('6:8').RowHeight = 23
    $sheet.Rows.Item(9).RowHeight = 24

    # BLOCO 2 — RESULTADO DO PORTFÓLIO.
    Style-SectionHeader $sheet 11 'BLOCO 2 — RESULTADO DO PORTFÓLIO  ·  ⚙ AUTOMÁTICO'
    $cardDefinitions = @(
        @('A12:D12','A13:D16','CARTEIRA TOTAL','=COUNTIF($AA$2:$AA$1000,"?*")',$colors.BlueSoft,'0'),
        @('E12:H12','E13:H16','CONCLUÍDAS','=COUNTIF($AN$2:$AN$1000,"Concluído")',$colors.GreenSoft,'0'),
        @('I12:M12','I13:M16','EM ABERTO','=SUM($AO$2:$AO$1000)',$colors.AmberSoft,'0'),
        @('N12:Q12','N13:Q16','TAXA DE CONCLUSÃO','=IF(SUM($AW$2:$AW$1000)=0,"",SUM($AY$2:$AY$1000)/SUM($AW$2:$AW$1000))',$colors.BlueSoft,'0,0%'),
        @('A18:D18','A19:D22','HORAS INVESTIDAS','=IF(COUNT($AR$2:$AR$1000)=0,"",SUM($AR$2:$AR$1000))',$colors.Surface,'#.##0,0 "h"'),
        @('E18:H18','E19:H22','GANHO MENSAL','=IF(COUNT($AU$2:$AU$1000)=0,"",SUM($AU$2:$AU$1000))',$colors.GreenSoft,'#.##0,0 "h/mês"'),
        @('I18:M18','I19:M22','GANHO ANUALIZADO','=IF($E$19="","",$E$19*12)',$colors.BlueSoft,'#.##0,0 "h/ano"'),
        @('N18:Q18','N19:Q22','LEAD TIME MÉDIO','=IFERROR(AVERAGE($AZ$2:$AZ$1000),"")',$colors.Surface,'0,0 "dias"')
    )
    foreach ($definition in $cardDefinitions) {
        Merge-Cells $sheet $definition[0]
        Merge-Cells $sheet $definition[1]
        $labelCell = $definition[0].Split(':')[0]
        $valueCell = $definition[1].Split(':')[0]
        Set-Text $sheet $labelCell $definition[2]
        Set-Formula $sheet $valueCell $definition[3]
        Style-Card $sheet $definition[0] $definition[1] $definition[4]
        $range = $sheet.Range($definition[1])
        $range.NumberFormatLocal = $definition[5]
        Release-ComObject $range
    }
    Merge-Cells $sheet 'A23:Q23'
    Set-Formula $sheet 'A23' '=SUM($AW$2:$AW$1000)&" demandas como Responsável | "&SUM($AY$2:$AY$1000)&" entregas concluídas como Responsável | "&COUNTIF($AF$2:$AF$1000,"Apoio")&" demandas como Apoio"'
    Style-Range $sheet 'A23:Q23' $colors.Surface $colors.Muted 9 $true -4131 -4108 $true

    # BLOCO 3 — ATENÇÃO GERENCIAL.
    Style-SectionHeader $sheet 26 'BLOCO 3 — ATENÇÃO GERENCIAL'
    Merge-Cells $sheet 'A27:Q27'
    Merge-Cells $sheet 'A28:Q28'
    Set-Formula $sheet 'A27' '=SUM($AO$2:$AO$1000)&" abertas | "&COUNTIF($AN$2:$AN$1000,"Bloqueado")&" bloqueadas | E3 pendente: "&SUM($AL$2:$AL$1000)&" | E5 pendente: "&SUM($AM$2:$AM$1000)&" | "&COUNTIF($BH$2:$BH$1000,"🔴 Hypercare Atrasado")&" atrasadas | "&SUM($BK$2:$BK$1000)&" incidentes"'
    Set-Formula $sheet 'A28' '=TEXTJOIN(" | ",TRUE,$CI$2:$CI$10)'
    Style-Range $sheet 'A27:Q27' $colors.AmberSoft $colors.Ink 10 $true -4131 -4108 $true
    Style-Range $sheet 'A28:Q28' $colors.BlueSoft $colors.Accent 10 $true -4131 -4108 $true
    Set-Text $sheet 'A29' 'ID'
    Set-Text $sheet 'B29' 'ATIVIDADE'
    Set-Text $sheet 'F29' 'PROJETO'
    Set-Text $sheet 'I29' 'STATUS'
    Set-Text $sheet 'K29' 'ETAPA ATUAL'
    Set-Text $sheet 'M29' '% FLUXO'
    Set-Text $sheet 'N29' 'DIAS'
    Set-Text $sheet 'O29' 'SITUAÇÃO'
    Set-Text $sheet 'Q29' 'LINK'
    foreach ($address in @('B29:E29','F29:H29','I29:J29','K29:L29','O29:P29')) { Merge-Cells $sheet $address }
    foreach ($row in 30..39) {
        Merge-Cells $sheet "B${row}:E${row}"
        Merge-Cells $sheet "F${row}:H${row}"
        Merge-Cells $sheet "I${row}:J${row}"
        Merge-Cells $sheet "K${row}:L${row}"
        Merge-Cells $sheet "O${row}:P${row}"
        $rank = $row - 29
        $indexExpression = "MATCH(LARGE(`$BW`$2:`$BW`$1000,$rank),`$BW`$2:`$BW`$1000,0)"
        Set-Formula $sheet "A$row" "=IFERROR(INDEX(`$AA`$2:`$AA`$1000,$indexExpression),"""")"
        Set-Formula $sheet "B$row" "=IF(`$A$row="""","""",INDEX(`$AB`$2:`$AB`$1000,$indexExpression))"
        Set-Formula $sheet "F$row" "=IF(`$A$row="""","""",INDEX(`$AC`$2:`$AC`$1000,$indexExpression))"
        Set-Formula $sheet "I$row" "=IF(`$A$row="""","""",INDEX(`$AN`$2:`$AN`$1000,$indexExpression))"
        Set-Formula $sheet "K$row" "=IF(`$A$row="""","""",INDEX(`$AI`$2:`$AI`$1000,$indexExpression))"
        Set-Formula $sheet "M$row" "=IF(`$A$row="""","""",INDEX(`$AJ`$2:`$AJ`$1000,$indexExpression))"
        Set-Formula $sheet "N$row" "=IF(`$A$row="""","""",INDEX(`$AP`$2:`$AP`$1000,$indexExpression))"
        Set-Formula $sheet "O$row" "=IF(`$A$row="""","""",INDEX(`$AQ`$2:`$AQ`$1000,$indexExpression))"
        Set-Formula $sheet "Q$row" "=IF(`$A$row="""","""",HYPERLINK(""#'Lançamentos'!B""&MATCH(`$A$row,Lançamentos!`$B`$3:`$B`$1001,0)+2,""Abrir""))"
        $rowRange = $sheet.Range("A${row}:Q${row}")
        $rowRange.Interior.Color = $(if ($row % 2 -eq 0) { $colors.White } else { $colors.Surface })
        $rowRange.Font.Size = 9
        $rowRange.Borders.Color = $colors.Border
        $rowRange.Borders.LineStyle = 1
        Release-ComObject $rowRange
    }
    $sheet.Range('M30:M39').NumberFormatLocal = '0,0%'
    $sheet.Range('N30:N39').NumberFormatLocal = '0'
    Style-TableHeader $sheet 'A29:Q29'
    Add-ExpressionFormat $sheet 'A30:Q39' '=$O30="Atenção"' $colors.AmberSoft $colors.Ink
    Add-ExpressionFormat $sheet 'A30:Q39' '=$O30="Crítico"' $colors.RedSoft $colors.Red
    Add-ExpressionFormat $sheet 'A30:Q39' '=$O30="Sem data"' $colors.RedSoft $colors.Red
    Merge-Cells $sheet 'A40:Q40'
    Set-Text $sheet 'A40' 'Ordenação: demanda aberta mais antiga para a mais recente · até 15 dias = normal · 16–30 = atenção · acima de 30 = crítico.'
    Style-Range $sheet 'A40:Q40' $colors.White $colors.Muted 8 $false -4131 -4108 $true

    # BLOCO 4 — IMPACTO GERADO.
    Style-SectionHeader $sheet 42 'BLOCO 4 — IMPACTO GERADO'
    foreach ($address in @('A43:D43','A44:D46','E43:H43','E44:H46','I43:Q43','I44:Q46')) { Merge-Cells $sheet $address }
    Set-Text $sheet 'A43' 'CAPACIDADE MENSAL LIBERADA'
    Set-Formula $sheet 'A44' '=$E$19'
    Set-Text $sheet 'E43' 'CAPACIDADE ANUALIZADA'
    Set-Formula $sheet 'E44' '=$I$19'
    Set-Text $sheet 'I43' 'CONCENTRAÇÃO DO RESULTADO'
    Set-Formula $sheet 'I44' '=IF(OR($E$19="",COUNT($L$48:$L$50)=0),"Sem ganho mensurado","As 3 maiores iniciativas representam "&TEXT(SUM($L$48:$L$50)/$E$19,"0,0%")&" de toda a capacidade mensal liberada.")'
    Style-Card $sheet 'A43:D43' 'A44:D46' $colors.GreenSoft
    Style-Card $sheet 'E43:H43' 'E44:H46' $colors.BlueSoft
    Style-Card $sheet 'I43:Q43' 'I44:Q46' $colors.Surface
    $sheet.Range('A44:D46').NumberFormatLocal = '#.##0,0 "h/mês"'
    $sheet.Range('E44:H46').NumberFormatLocal = '#.##0,0 "h/ano"'
    $sheet.Range('I44:Q46').Font.Size = 12
    Set-Text $sheet 'A47' 'POS.'
    Set-Text $sheet 'B47' 'ATIVIDADE'
    Set-Text $sheet 'I47' 'PROJETO'
    Set-Text $sheet 'L47' 'GANHO'
    Set-Text $sheet 'M47' '% REDUÇÃO'
    Set-Text $sheet 'N47' 'BARRA PROPORCIONAL'
    Set-Text $sheet 'Q47' 'LINK'
    foreach ($address in @('B47:H47','I47:K47','N47:P47')) { Merge-Cells $sheet $address }
    Style-TableHeader $sheet 'A47:Q47'
    foreach ($row in 48..52) {
        Merge-Cells $sheet "B${row}:H${row}"
        Merge-Cells $sheet "I${row}:K${row}"
        Merge-Cells $sheet "N${row}:P${row}"
        $rank = $row - 47
        $indexExpression = "MATCH(LARGE(`$BX`$2:`$BX`$1000,$rank),`$BX`$2:`$BX`$1000,0)"
        Set-Formula $sheet "A$row" "=IF(`$B$row="""","""",$rank)"
        Set-Formula $sheet "B$row" "=IFERROR(INDEX(`$AB`$2:`$AB`$1000,$indexExpression),"""")"
        Set-Formula $sheet "I$row" "=IF(`$B$row="""","""",INDEX(`$AC`$2:`$AC`$1000,$indexExpression))"
        Set-Formula $sheet "L$row" "=IF(`$B$row="""","""",INDEX(`$AU`$2:`$AU`$1000,$indexExpression))"
        Set-Formula $sheet "M$row" "=IF(`$B$row="""","""",INDEX(`$AV`$2:`$AV`$1000,$indexExpression))"
        Set-Formula $sheet "N$row" "=IF(OR(`$L$row="""",MAX(`$L`$48:`$L`$52)=0),"""",REPT(""■"",MAX(1,ROUND(`$L$row/MAX(`$L`$48:`$L`$52)*10,0))))"
        Set-Formula $sheet "Q$row" "=IF(`$B$row="""","""",HYPERLINK(""#'Lançamentos'!B""&MATCH(INDEX(`$AA`$2:`$AA`$1000,$indexExpression),Lançamentos!`$B`$3:`$B`$1001,0)+2,""Abrir""))"
        $rowRange = $sheet.Range("A${row}:Q${row}")
        $rowRange.Interior.Color = $(if ($row % 2 -eq 0) { $colors.White } else { $colors.Surface })
        $rowRange.Borders.Color = $colors.Border
        $rowRange.Borders.LineStyle = 1
        Release-ComObject $rowRange
    }
    $sheet.Range('L48:L52').NumberFormatLocal = '#.##0,0 "h/mês"'
    $sheet.Range('M48:M52').NumberFormatLocal = '0,0%'
    $sheet.Range('N48:P52').Font.Color = $colors.Accent
    $sheet.Range('N48:P52').Font.Name = 'Calibri'

    # BLOCO 5 — DISTRIBUIÇÃO DO IMPACTO.
    Style-SectionHeader $sheet 54 'BLOCO 5 — DISTRIBUIÇÃO DO IMPACTO'
    Merge-Cells $sheet 'A55:B55'
    Merge-Cells $sheet 'C55:E55'
    Merge-Cells $sheet 'F55:Q56'
    Set-Text $sheet 'A55' 'DIMENSÃO'
    Set-Text $sheet 'C55' 'PROJETO'
    Set-Formula $sheet 'F55' '=IF($A58="","Sem classificações com movimento.",IF($A59="",$A58&" responde por "&TEXT($N58,"0,0%")&" do ganho mensal.",$A58&" e "&$A59&" concentram "&TEXT($N58+$N59,"0,0%")&" do ganho mensal."))'
    Style-Range $sheet 'A55:B55' $colors.Surface $colors.Muted 9 $true -4108 -4108 $false
    Style-Range $sheet 'C55:E55' $colors.BlueSoft $colors.Accent 10 $true -4108 -4108 $false
    Style-Range $sheet 'F55:Q56' $colors.GreenSoft $colors.Green 11 $true -4131 -4108 $true
    Add-Outline $sheet 'C55:E55' $colors.Accent 2
    $selector = $sheet.Range('C55')
    $selector.Validation.Delete()
    $selector.Validation.Add(3, 1, 1, '=$CJ$2:$CJ$4')
    $selector.Validation.IgnoreBlank = $false
    $selector.Validation.InCellDropdown = $true
    $selector.Validation.InputTitle = 'Dimensão de análise'
    $selector.Validation.InputMessage = 'Selecione Projeto, Pilar ou Departamento CSC.'
    Release-ComObject $selector
    Set-Text $sheet 'A57' 'CLASSIFICAÇÃO'
    Set-Text $sheet 'F57' 'DEMANDAS'
    Set-Text $sheet 'H57' 'CONCLUÍDAS'
    Set-Text $sheet 'J57' 'HORAS'
    Set-Text $sheet 'K57' 'GANHO H/MÊS'
    Set-Text $sheet 'N57' '% GANHO'
    Set-Text $sheet 'O57' 'BARRA DE IMPACTO'
    foreach ($address in @('A57:E57','F57:G57','H57:I57','K57:M57','O57:Q57')) { Merge-Cells $sheet $address }
    Style-TableHeader $sheet 'A57:Q57'
    foreach ($row in 58..67) {
        Merge-Cells $sheet "A${row}:E${row}"
        Merge-Cells $sheet "F${row}:G${row}"
        Merge-Cells $sheet "H${row}:I${row}"
        Merge-Cells $sheet "K${row}:M${row}"
        Merge-Cells $sheet "O${row}:Q${row}"
        $rank = $row - 57
        $indexExpression = "MATCH(LARGE(`$CF`$2:`$CF`$101,$rank),`$CF`$2:`$CF`$101,0)"
        Set-Formula $sheet "A$row" "=IFERROR(INDEX(`$BZ`$2:`$BZ`$101,$indexExpression),"""")"
        Set-Formula $sheet "F$row" "=IF(`$A$row="""","""",INDEX(`$CA`$2:`$CA`$101,MATCH(`$A$row,`$BZ`$2:`$BZ`$101,0)))"
        Set-Formula $sheet "H$row" "=IF(`$A$row="""","""",INDEX(`$CB`$2:`$CB`$101,MATCH(`$A$row,`$BZ`$2:`$BZ`$101,0)))"
        Set-Formula $sheet "J$row" "=IF(`$A$row="""","""",INDEX(`$CC`$2:`$CC`$101,MATCH(`$A$row,`$BZ`$2:`$BZ`$101,0)))"
        Set-Formula $sheet "K$row" "=IF(`$A$row="""","""",INDEX(`$CD`$2:`$CD`$101,MATCH(`$A$row,`$BZ`$2:`$BZ`$101,0)))"
        Set-Formula $sheet "N$row" "=IF(`$A$row="""","""",INDEX(`$CE`$2:`$CE`$101,MATCH(`$A$row,`$BZ`$2:`$BZ`$101,0)))"
        Set-Formula $sheet "O$row" "=IF(OR(`$K$row="""",`$K$row=0,MAX(`$K`$58:`$K`$67)=0),"""",REPT(""■"",MAX(1,ROUND(`$K$row/MAX(`$K`$58:`$K`$67)*10,0))))"
        $rowRange = $sheet.Range("A${row}:Q${row}")
        $rowRange.Interior.Color = $(if ($row % 2 -eq 0) { $colors.White } else { $colors.Surface })
        $rowRange.Borders.Color = $colors.Border
        $rowRange.Borders.LineStyle = 1
        Release-ComObject $rowRange
    }
    $sheet.Range('J58:J67').NumberFormatLocal = '#.##0,0'
    $sheet.Range('K58:M67').NumberFormatLocal = '#.##0,0'
    $sheet.Range('N58:N67').NumberFormatLocal = '0,0%'
    $sheet.Range('O58:Q67').Font.Color = $colors.Accent
    Merge-Cells $sheet 'A68:Q68'
    Set-Text $sheet 'A68' 'Somente classificações com movimentação são exibidas · ordenação pelo ganho mensal.'
    Style-Range $sheet 'A68:Q68' $colors.White $colors.Muted 8 $false -4131 -4108 $true

    # BLOCO 6 — EFICIÊNCIA E ESTABILIZAÇÃO.
    Style-SectionHeader $sheet 70 'BLOCO 6 — EFICIÊNCIA E ESTABILIZAÇÃO'
    $compactDefinitions = @(
        @('A71:C71','A72:C74','TAXA DE CONCLUSÃO','=$N$13','0,0%'),
        @('D71:F71','D72:F74','REDUÇÃO MÉDIA','=IFERROR(AVERAGE($AV$2:$AV$1000),"")','0,0%'),
        @('G71:I71','G72:I74','LEAD TIME MÉDIO','=$N$19','0,0 "dias"'),
        @('J71:L71','J72:L74','HYPERCARE NO PRAZO','=IF(SUM($BM$2:$BM$1000)=0,"",SUM($BN$2:$BN$1000)/SUM($BM$2:$BM$1000))','0,0%'),
        @('M71:O71','M72:O74','COBERTURA HYPERCARE','=IF(SUM($BO$2:$BO$1000)=0,"",COUNT($BD$2:$BD$1000)/SUM($BO$2:$BO$1000))','0,0%'),
        @('P71:Q71','P72:Q74','EFICIÊNCIA','=IF(OR($E$19="",$A$19="",$A$19=0),"",$E$19/$A$19)','0,0"x"')
    )
    foreach ($definition in $compactDefinitions) {
        $labelCell = ($definition[0].Split(':'))[0]
        $valueCell = ($definition[1].Split(':'))[0]
        $outlineEnd = ($definition[1].Split(':'))[-1]
        Merge-Cells $sheet $definition[0]
        Merge-Cells $sheet $definition[1]
        Set-Text $sheet $labelCell $definition[2]
        Set-Formula $sheet $valueCell $definition[3]
        Style-Range $sheet $definition[0] $colors.Surface $colors.Muted 8 $true -4108 -4108 $true
        Style-Range $sheet $definition[1] $colors.White $colors.Ink 16 $true -4108 -4108 $true
        Add-Outline $sheet ($labelCell + ':' + $outlineEnd) $colors.Border 2
        $sheet.Range($definition[1]).NumberFormatLocal = $definition[4]
    }
    Merge-Cells $sheet 'A76:Q76'
    Merge-Cells $sheet 'A77:Q79'
    Merge-Cells $sheet 'A80:Q80'
    Set-Text $sheet 'A76' 'SAÚDE DO HYPERCARE'
    Set-Formula $sheet 'A77' '=SUM($BI$2:$BI$1000)&" em estabilização efetiva | "&SUM($BJ$2:$BJ$1000)&" encerradas estáveis | "&COUNTIF($BH$2:$BH$1000,"🔴 Hypercare Atrasado")&" atrasadas | "&SUM($BK$2:$BK$1000)&" incidentes | "&SUM($BL$2:$BL$1000)&" novas demandas | "&IFERROR(TEXT(AVERAGEIFS($BF$2:$BF$1000,$BM$2:$BM$1000,1),"0,00")&" dias médios","sem duração")'
    Set-Formula $sheet 'A80' '=IF(SUM($BU$2:$BU$1000)>0,"Há "&SUM($BU$2:$BU$1000)&" Hypercare iniciado fora da sequência oficial do workflow.",IF(AND(COUNTIF($BH$2:$BH$1000,"🔴 Hypercare Atrasado")=0,SUM($BK$2:$BK$1000)=0),"Não existem Hypercares atrasados ou incidentes críticos.","Revisar a saúde do Hypercare."))'
    Style-Range $sheet 'A76:Q76' $colors.Dark $colors.White 9 $true -4131 -4108 $false
    Style-Range $sheet 'A77:Q79' $colors.BlueSoft $colors.Ink 11 $true -4108 -4108 $true
    Style-Range $sheet 'A80:Q80' $colors.AmberSoft $colors.Amber 9 $true -4131 -4108 $true

    # BLOCO 7 — INTEGRIDADE DOS DADOS.
    Style-SectionHeader $sheet 82 'BLOCO 7 — INTEGRIDADE DOS DADOS'
    foreach ($address in @('A83:E83','A84:E88','F83:H83','F84:H88','I83:K83','I84:K88','L83:N83','L84:N88','O83:Q83','O84:Q88')) { Merge-Cells $sheet $address }
    Set-Text $sheet 'A83' 'STATUS DE INTEGRIDADE'
    Set-Formula $sheet 'A84' '=IF(AND(COUNTIF($AA$2:$AA$1000,"?*")=SUM($BR$2:$BR$1000),COUNTIF($AA$2:$AA$1000,"?*")=SUM($BS$2:$BS$1000),COUNTIF($AA$2:$AA$1000,"?*")=SUM($BT$2:$BT$1000),$CK$2=0),"INTEGRIDADE OK","REVISAR CLASSIFICAÇÕES")'
    Set-Text $sheet 'F83' 'CARTEIRA'
    Set-Formula $sheet 'F84' '=COUNTIF($AA$2:$AA$1000,"?*")'
    Set-Text $sheet 'I83' 'PROJETO'
    Set-Formula $sheet 'I84' '=SUM($BR$2:$BR$1000)'
    Set-Text $sheet 'L83' 'PILAR'
    Set-Formula $sheet 'L84' '=SUM($BS$2:$BS$1000)'
    Set-Text $sheet 'O83' 'DEPARTAMENTO'
    Set-Formula $sheet 'O84' '=SUM($BT$2:$BT$1000)'
    Style-Range $sheet 'A83:Q83' $colors.Surface $colors.Muted 8 $true -4108 -4108 $true
    Style-Range $sheet 'A84:E88' $colors.GreenSoft $colors.Green 15 $true -4108 -4108 $true
    foreach ($address in @('F84:H88','I84:K88','L84:N88','O84:Q88')) { Style-Range $sheet $address $colors.White $colors.Ink 18 $true -4108 -4108 $true; Add-Outline $sheet $address $colors.Border 2 }
    Add-ExpressionFormat $sheet 'A84:E88' '=$A$84="REVISAR CLASSIFICAÇÕES"' $colors.RedSoft $colors.Red
    Merge-Cells $sheet 'A89:H89'
    Merge-Cells $sheet 'A90:H92'
    Merge-Cells $sheet 'I89:Q89'
    Merge-Cells $sheet 'I90:Q92'
    Set-Text $sheet 'A89' 'HORAS INFORMADAS'
    Set-Formula $sheet 'A90' '=IF(COUNTIF($AA$2:$AA$1000,"?*")=0,"Sem carteira",SUM($BP$2:$BP$1000)&"/"&COUNTIF($AA$2:$AA$1000,"?*")&" | "&TEXT(SUM($BP$2:$BP$1000)/COUNTIF($AA$2:$AA$1000,"?*"),"0,0%"))'
    Set-Text $sheet 'I89' 'GANHO MENSURADO'
    Set-Formula $sheet 'I90' '=IF(COUNTIF($AA$2:$AA$1000,"?*")=0,"Sem carteira",SUM($BQ$2:$BQ$1000)&"/"&COUNTIF($AA$2:$AA$1000,"?*")&" | "&TEXT(SUM($BQ$2:$BQ$1000)/COUNTIF($AA$2:$AA$1000,"?*"),"0,0%"))'
    Style-Range $sheet 'A89:H89' $colors.Surface $colors.Muted 9 $true -4108 -4108 $false
    Style-Range $sheet 'I89:Q89' $colors.Surface $colors.Muted 9 $true -4108 -4108 $false
    Style-Range $sheet 'A90:H92' $colors.BlueSoft $colors.Accent 15 $true -4108 -4108 $true
    Style-Range $sheet 'I90:Q92' $colors.BlueSoft $colors.Accent 15 $true -4108 -4108 $true
    Merge-Cells $sheet 'A93:Q94'
    Set-Formula $sheet 'A93' '=IF($A$84="INTEGRIDADE OK","Classificações reconciliadas com Cadastros e com a carteira.","Existem demandas com classificação vazia, fora de Cadastros ou ID duplicado.")&IF(SUM($BU$2:$BU$1000)>0,"  ALERTA: "&INDEX($AA$2:$AA$1000,MATCH(1,$BU$2:$BU$1000,0))&" possui Hypercare iniciado antes de E7 concluída ("&INDEX($AI$2:$AI$1000,MATCH(1,$BU$2:$BU$1000,0))&").","")'
    Style-Range $sheet 'A93:Q94' $colors.AmberSoft $colors.Ink 9 $true -4131 -4108 $true
    Merge-Cells $sheet 'A95:Q95'
    Set-Text $sheet 'A95' '⚙ Dashboard 100% automático e somente leitura · o contexto qualitativo permanece no Acompanhamento Semanal.'
    Style-Range $sheet 'A95:Q95' $colors.Dark $colors.White 8 $true -4108 -4108 $true

    # Área auxiliar controlada e oculta: uma regra única para status, etapa, ganho, qualidade e integridade.
    $helperHeaders = @(
        'ID','Atividade','Projeto','Pilar','Departamento','Papel','Data Início','Data Conclusão','Etapa Atual','% Fluxo',
        'Bloqueios','Gate E3','Gate E5','Status Derivado','Aberta','Dias Abertos','Situação','Horas','Tempo Antes','Tempo Depois',
        'Ganho Responsável','Redução','Responsável','Concluída','Concluída Responsável','Lead Time','E7','E8','Resultado Hypercare',
        'Início Hypercare','Encerramento Real','Dias Hypercare','Prazo Hypercare','Situação Hypercare','Estabilização Efetiva',
        'Estável','Incidente','Nova Demanda','Hypercare Concluído','Hypercare no Prazo','Entrega','Horas Informadas',
        'Ganho Mensurado','Projeto Válido','Pilar Válido','Departamento Válido','Hypercare Fora do Fluxo','Crítica',
        'Chave Abertas','Chave Ganho','Dimensão Selecionada'
    )
    $helperStartColumn = 27
    for ($index = 0; $index -lt $helperHeaders.Count; $index += 1) {
        $sheet.Cells.Item(1, $helperStartColumn + $index).Value2 = $helperHeaders[$index]
    }

    $helperFormulas = [ordered]@{
        'AA2' = '=Lançamentos!B3'
        'AB2' = '=IF($AA2="","",Lançamentos!J3)'
        'AC2' = '=IF($AA2="","",Lançamentos!F3)'
        'AD2' = '=IF($AA2="","",Lançamentos!H3)'
        'AE2' = '=IF($AA2="","",Lançamentos!L3)'
        'AF2' = '=IF($AA2="","",Lançamentos!O3)'
        'AG2' = '=IF($AA2="","",Lançamentos!C3)'
        'AH2' = '=IF(OR($AA2="",Lançamentos!D3=""),"",Lançamentos!D3)'
        'AI2' = '=IF($AA2="","",IFERROR(INDEX(''Workflow (Tracker)''!$M$26:$M$1024,MATCH($AA2,''Workflow (Tracker)''!$B$26:$B$1024,0)),""))'
        'AJ2' = '=IF($AA2="","",IFERROR(INDEX(''Workflow (Tracker)''!$N$26:$N$1024,MATCH($AA2,''Workflow (Tracker)''!$B$26:$B$1024,0)),""))'
        'AK2' = '=IF($AA2="","",IFERROR(COUNTIF(INDEX(''Workflow (Tracker)''!$E$26:$L$1024,MATCH($AA2,''Workflow (Tracker)''!$B$26:$B$1024,0),0),"Bloqueado"),0))'
        'AL2' = '=IF($AA2="","",--(IFERROR(INDEX(''Workflow (Tracker)''!$G$26:$G$1024,MATCH($AA2,''Workflow (Tracker)''!$B$26:$B$1024,0)),"")<>"Concluído"))'
        'AM2' = '=IF($AA2="","",--(IFERROR(INDEX(''Workflow (Tracker)''!$I$26:$I$1024,MATCH($AA2,''Workflow (Tracker)''!$B$26:$B$1024,0)),"")<>"Concluído"))'
        'AN2' = '=IF($AA2="","",IF(Lançamentos!S3="Cancelado","Cancelado",IF($AI2="✔ Fluxo concluído","Concluído",IF($AK2>0,"Bloqueado",IF(LEFT($AI2,3)="E08","Em Hypercare",IF($AJ2>0,"Em andamento","Não iniciado"))))))'
        'AO2' = '=IF($AA2="","",--(AND($AN2<>"Concluído",$AN2<>"Cancelado")))'
        'AP2' = '=IF($AO2<>1,"",IF(ISNUMBER($AG2),MAX(0,TODAY()-$AG2),""))'
        'AQ2' = '=IF($AO2<>1,"",IF($AP2="","Sem data",IF($AP2<=15,"Normal",IF($AP2<=30,"Atenção","Crítico"))))'
        'AR2' = '=IF(OR($AA2="",Lançamentos!T3=""),"",Lançamentos!T3)'
        'AS2' = '=IF(OR($AA2="",Lançamentos!U3=""),"",Lançamentos!U3)'
        'AT2' = '=IF(OR($AA2="",Lançamentos!V3=""),"",Lançamentos!V3)'
        'AU2' = '=IF(OR($AA2="",$AF2="Apoio",NOT(ISNUMBER($AS2)),$AS2<=0,NOT(ISNUMBER($AT2))),"",$AS2-$AT2)'
        'AV2' = '=IF(OR(NOT(ISNUMBER($AS2)),$AS2<=0,NOT(ISNUMBER($AT2))),"",($AS2-$AT2)/$AS2)'
        'AW2' = '=IF($AA2="","",--($AF2<>"Apoio"))'
        'AX2' = '=IF($AA2="","",--($AN2="Concluído"))'
        'AY2' = '=IF($AA2="","",--(AND($AN2="Concluído",$AF2<>"Apoio")))'
        'AZ2' = '=IF(OR($AA2="",$AN2<>"Concluído",Lançamentos!AK3=""),"",Lançamentos!AK3)'
        'BA2' = '=IF($AA2="","",IFERROR(INDEX(''Workflow (Tracker)''!$K$26:$K$1024,MATCH($AA2,''Workflow (Tracker)''!$B$26:$B$1024,0)),""))'
        'BB2' = '=IF($AA2="","",IFERROR(INDEX(''Workflow (Tracker)''!$L$26:$L$1024,MATCH($AA2,''Workflow (Tracker)''!$B$26:$B$1024,0)),""))'
        'BC2' = '=IF(OR($AA2="",Lançamentos!AI3=""),"",Lançamentos!AI3)'
        'BD2' = '=IF(OR($AA2="",Lançamentos!AD3=""),"",Lançamentos!AD3)'
        'BE2' = '=IF(OR($AA2="",Lançamentos!AF3=""),"",Lançamentos!AF3)'
        'BF2' = '=IF(OR($AA2="",Lançamentos!AG3=""),"",Lançamentos!AG3)'
        'BG2' = '=IF($AA2="","",IFERROR(INDEX(''E08 — Estabilização Hypercare''!$P$8:$P$1006,MATCH($AA2,''E08 — Estabilização Hypercare''!$B$8:$B$1006,0)),""))'
        'BH2' = '=IF(OR($AA2="",Lançamentos!AH3=""),"",Lançamentos!AH3)'
        'BI2' = '=IF($AA2="","",--(AND($BC2="🔄 Em Estabilização",OR($BA2="Concluído",LEFT($AI2,3)="E08"))))'
        'BJ2' = '=IF($AA2="","",--($BC2="✅ Estável — Demanda Encerrada"))'
        'BK2' = '=IF($AA2="","",--ISNUMBER(SEARCH("Incidente Crítico",$BC2)))'
        'BL2' = '=IF($AA2="","",--ISNUMBER(SEARCH("Evolução Identificada",$BC2)))'
        'BM2' = '=IF($AA2="","",--($BB2="Concluído"))'
        'BN2' = '=IF($AA2="","",--(AND($BM2=1,ISNUMBER($BF2),ISNUMBER($BG2),$BF2<=$BG2)))'
        'BO2' = '=IF($AA2="","",--ISNUMBER($AH2))'
        'BP2' = '=IF($AA2="","",--ISNUMBER($AR2))'
        'BQ2' = '=IF($AA2="","",--(AND(ISNUMBER($AS2),$AS2>0,ISNUMBER($AT2))))'
        'BR2' = '=IF($AA2="","",--(AND($AC2<>"",COUNTIF(Cadastros!$B$6:$B$100,$AC2)>0)))'
        'BS2' = '=IF($AA2="","",--(AND($AD2<>"",COUNTIF(Cadastros!$K$6:$K$100,$AD2)>0)))'
        'BT2' = '=IF($AA2="","",--(AND($AE2<>"",COUNTIF(Cadastros!$L$6:$L$100,$AE2)>0)))'
        'BU2' = '=IF($AA2="","",--(AND(ISNUMBER($BD2),$BA2<>"Concluído",LEFT($AI2,3)<>"E08")))'
        'BV2' = '=IF($AA2="","",--(OR($AN2="Bloqueado",$BH2="🔴 Hypercare Atrasado",$BK2=1)))'
        'BW2' = '=IF($AO2=1,IF(ISNUMBER($AP2),$AP2,-1)+ROW()/1000000,"")'
        'BX2' = '=IF(AND(ISNUMBER($AU2),$AU2>0),$AU2+ROW()/1000000000,"")'
        'BY2' = '=IF($AA2="","",IF($C$55="PROJETO",$AC2,IF($C$55="PILAR",$AD2,$AE2)))'
    }
    foreach ($entry in $helperFormulas.GetEnumerator()) {
        try {
            Set-Formula $sheet $entry.Key $entry.Value
        }
        catch {
            throw "Falha na fórmula auxiliar $($entry.Key): $($entry.Value). $($_.Exception.Message)"
        }
        $columnLetters = $entry.Key -replace '\d', ''
        $sheet.Range("${columnLetters}2:${columnLetters}1000").FillDown()
    }

    # Catálogo selecionado e agregações por dimensão.
    for ($row = 2; $row -le 101; $row += 1) {
        $catalogRow = $row + 4
        Set-Formula $sheet "BZ$row" "=IF(`$C`$55=""PROJETO"",Cadastros!B$catalogRow,IF(`$C`$55=""PILAR"",Cadastros!K$catalogRow,Cadastros!L$catalogRow))"
        Set-Formula $sheet "CA$row" "=IF(`$BZ$row="""","""",COUNTIF(`$BY`$2:`$BY`$1000,`$BZ$row))"
        Set-Formula $sheet "CB$row" "=IF(`$BZ$row="""","""",COUNTIFS(`$BY`$2:`$BY`$1000,`$BZ$row,`$AN`$2:`$AN`$1000,""Concluído""))"
        Set-Formula $sheet "CC$row" "=IF(OR(`$BZ$row="""",`$CA$row=0),"""",SUMIF(`$BY`$2:`$BY`$1000,`$BZ$row,`$AR`$2:`$AR`$1000))"
        Set-Formula $sheet "CD$row" "=IF(OR(`$BZ$row="""",`$CA$row=0),"""",SUMIF(`$BY`$2:`$BY`$1000,`$BZ$row,`$AU`$2:`$AU`$1000))"
        Set-Formula $sheet "CE$row" "=IF(OR(`$CD$row="""",SUM(`$AU`$2:`$AU`$1000)=0),"""",`$CD$row/SUM(`$AU`$2:`$AU`$1000))"
        Set-Formula $sheet "CF$row" "=IF(`$CA$row>0,`$CD$row+ROW()/1000000000,"""")"
    }

    $stageLabels = @(
        '✔ Fluxo concluído',
        'E1 — Solicitação',
        'E2 — Triagem',
        'E3 — Levantamento ⚠',
        'E4 — Execução',
        'E5 — Validação ⚠',
        'E6 — Ajustes',
        'E7 — Entrega',
        'E08 — Estabilização / Hypercare'
    )
    for ($index = 0; $index -lt $stageLabels.Count; $index += 1) {
        $row = $index + 2
        Set-Text $sheet "CG$row" $stageLabels[$index]
        Set-Formula $sheet "CH$row" "=COUNTIF(`$AI`$2:`$AI`$1000,`$CG$row)"
        Set-Formula $sheet "CI$row" "=IF(`$CH$row=0,"""",`$CH$row&IF(`$CG$row=""✔ Fluxo concluído"","" concluídas"","" em ""&LEFT(`$CG$row,FIND("" "",`$CG$row)-1)))"
    }
    Set-Text $sheet 'CJ2' 'PROJETO'
    Set-Text $sheet 'CJ3' 'PILAR'
    Set-Text $sheet 'CJ4' 'DEPARTAMENTO CSC'
    Set-Formula $sheet 'CK2' '=SUMPRODUCT(($AA$2:$AA$1000<>"")*(COUNTIF($AA$2:$AA$1000,$AA$2:$AA$1000)>1))'

    # Formatos auxiliares e ocultação.
    $sheet.Range('AG2:AH1000').NumberFormatLocal = 'dd/mm/aa'
    $sheet.Range('AJ2:AJ1000').NumberFormatLocal = '0,0%'
    $sheet.Range('AV2:AV1000').NumberFormatLocal = '0,0%'
    $sheet.Range('BD2:BE1000').NumberFormatLocal = 'dd/mm/aa'
    $sheet.Range('AA:CK').EntireColumn.Hidden = $true

    # Tooltips de governança nos principais indicadores.
    Add-Comment $sheet 'A12' 'Origem: IDs válidos da aba Lançamentos. Preenchimento automático — não editar.'
    Add-Comment $sheet 'E12' 'Origem: status derivado pelo Tracker E1–E08. Concluído somente quando o fluxo oficial estiver encerrado.'
    Add-Comment $sheet 'I12' 'Origem: status derivado. Exclui Concluído e Cancelado.'
    Add-Comment $sheet 'N12' 'Fórmula: entregas concluídas como Responsável ÷ demandas como Responsável. Apoios não entram no denominador.'
    Add-Comment $sheet 'A18' 'Origem: Horas Gastas preenchidas em Lançamentos. Vazio permanece vazio; zero é valor informado.'
    Add-Comment $sheet 'E18' 'Fórmula: Tempo Antes − Tempo Depois, somente com dados válidos e Papel diferente de Apoio.'
    Add-Comment $sheet 'I18' 'Fórmula: ganho mensal × 12.'
    Add-Comment $sheet 'N18' 'Fórmula: Encerramento Real do Hypercare − Data Início, somente para fluxos concluídos com ambas as datas.'
    Add-Comment $sheet 'P71' 'Eficiência da Transformação: horas mensais de capacidade liberada para cada hora investida. Não é retorno financeiro.'
    Add-Comment $sheet 'A83' 'Integridade compara Carteira total com classificações válidas por Projeto, Pilar e Departamento CSC e verifica IDs duplicados.'
    Add-Comment $sheet 'A89' 'Demandas com Horas Gastas efetivamente preenchidas ÷ Carteira total. Zero informado é válido; vazio não é zero.'
    Add-Comment $sheet 'I89' 'Demandas com Tempo Antes > 0 e Tempo Depois numérico ÷ Carteira total.'

    # Proteção somente do Dashboard: seletor permanece utilizável e hyperlinks clicáveis.
    $sheet.Cells.Locked = $true
    $sheet.Range('C55:E55').Locked = $false
    $sheet.Protect('', $true, $true, $true, $true)
    $sheet.EnableSelection = 0

    # Navegação, impressão e recálculo.
    $sheet.Activate()
    $excel.ActiveWindow.DisplayGridlines = $false
    $excel.ActiveWindow.Zoom = 85
    $excel.ActiveWindow.FreezePanes = $false
    $sheet.Range('A4').Select()
    $excel.ActiveWindow.FreezePanes = $true
    $sheet.PageSetup.PrintArea = '$A$1:$Q$95'
    $sheet.PageSetup.Orientation = 2
    $sheet.PageSetup.Zoom = $false
    $sheet.PageSetup.FitToPagesWide = 1
    $sheet.PageSetup.FitToPagesTall = 2
    $sheet.PageSetup.LeftMargin = $excel.InchesToPoints(0.25)
    $sheet.PageSetup.RightMargin = $excel.InchesToPoints(0.25)
    $sheet.PageSetup.TopMargin = $excel.InchesToPoints(0.35)
    $sheet.PageSetup.BottomMargin = $excel.InchesToPoints(0.35)
    $sheet.PageSetup.CenterHorizontally = $true

    $workbook.ForceFullCalculation = $true
    try { $workbook.FullCalculationOnLoad = $true } catch { }
    $workbook.RefreshAll()
    $excel.CalculateFullRebuild()
    $workbook.Save()
}
finally {
    if ($null -ne $workbook) {
        $workbook.Close($true)
        Release-ComObject $workbook
    }
    if ($null -ne $sheet) { Release-ComObject $sheet }
    if ($null -ne $excel) {
        $excel.Quit()
        Release-ComObject $excel
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Output $resolvedOutput
