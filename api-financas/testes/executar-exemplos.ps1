param(
    [ValidateSet('A', 'B')][string]$Modo = 'A',
    [switch]$SemPausas
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path $PSScriptRoot -Parent
$documento = if ($Modo -eq 'A') { 'docs/APRESENTACAO.md' } else { 'testes/requisicoes.md' }
Push-Location $raiz
try {
    # Executa somente os blocos HTTP marcados, escritos no proprio repositorio.
    $texto = Get-Content $documento -Raw -Encoding UTF8
    $blocos = [regex]::Matches($texto, '(?s)<!-- executar -->\s*```powershell\r?\n(.*?)```')
    if (!$blocos.Count) { throw 'Nenhum bloco de demonstracao encontrado.' }
    for ($i = 0; $i -lt $blocos.Count; $i++) {
        if (!$SemPausas) { Read-Host "Modo $Modo - bloco $($i+1)/$($blocos.Count). Enter para executar" | Out-Null }
        . ([scriptblock]::Create($blocos[$i].Groups[1].Value))
    }
    Write-Host "Modo $Modo concluido: $($blocos.Count) blocos, status HTTP conferidos."
} catch {
    Write-Host ('Exemplos interrompidos: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
} finally { Pop-Location }
