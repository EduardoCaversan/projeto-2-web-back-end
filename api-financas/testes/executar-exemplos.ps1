$ErrorActionPreference = 'Stop'
$raiz = Split-Path $PSScriptRoot -Parent
$documento = 'testes/requisicoes.md'
Push-Location $raiz
try {
    $texto = Get-Content $documento -Raw -Encoding UTF8
    $blocos = [regex]::Matches($texto, '(?s)<!-- executar -->\s*```powershell\r?\n(.*?)```')
    if (!$blocos.Count) { throw 'Nenhum bloco de teste encontrado.' }
    for ($i = 0; $i -lt $blocos.Count; $i++) {
        . ([scriptblock]::Create($blocos[$i].Groups[1].Value))
    }
    Write-Host "Testes concluidos: $($blocos.Count) blocos, status HTTP conferidos."
} catch {
    Write-Host ('Exemplos interrompidos: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
} finally { Pop-Location }
