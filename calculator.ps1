param(
    [string]$Expression
)

function Evaluate-Math ([string]$expr) {
    if ([string]::IsNullOrWhiteSpace($expr)) { return "0" }
    $clean = $expr.Trim()
    try {
        $val = Invoke-Expression "$clean"
        return $val
    } catch {
        return "Error: $($_.Exception.Message)"
    }
}

if ($Expression) {
    $res = Evaluate-Math $Expression
    Write-Output "Expression: $Expression"
    Write-Output "Result:     $res"
} else {
    Write-Output "⚡ AshCalc CLI"
    Write-Output "Usage: .\calculator.ps1 -Expression '<math_expression>'"
    Write-Output "Example: .\calculator.ps1 -Expression '1250 * 8 + 45'"
}
