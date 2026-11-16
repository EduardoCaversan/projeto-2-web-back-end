# Carregue na pasta api-financas. Os arquivos locais evitam escapes de JSON no PowerShell 5.1.
$baseApi = 'http://127.0.0.1:3000'
$script:pastaHttp = Join-Path $PSScriptRoot '.temporarios'
[IO.Directory]::CreateDirectory($script:pastaHttp) | Out-Null
$script:arquivoResposta = Join-Path $script:pastaHttp 'resposta.json'
$curlArgs = @('-sS', '--connect-timeout', '5', '--max-time', '15', '-o', $script:arquivoResposta, '-w', '%{http_code}')

function Salvar-Json($Dados) {
    $arquivo = Join-Path $script:pastaHttp 'requisicao.json'
    [IO.File]::WriteAllText($arquivo, ($Dados | ConvertTo-Json -Depth 10 -Compress), (New-Object Text.UTF8Encoding($false)))
    return "@$arquivo"
}

function Ler-Resposta([string]$Status, [int]$Esperado) {
    if ($LASTEXITCODE -ne 0) { throw 'curl.exe falhou. Confira se a API esta ligada.' }
    $corpo = [string](Get-Content -LiteralPath $script:arquivoResposta -Raw -Encoding UTF8)
    Write-Host "HTTP $Status (esperado $Esperado)"
    if ([int]$Status -ne $Esperado) { throw "Resposta inesperada: $corpo" }
    if ($Esperado -eq 204) {
        if (![string]::IsNullOrWhiteSpace($corpo)) { throw 'HTTP 204 deve ter corpo vazio.' }
        return
    }
    $json = $corpo | ConvertFrom-Json
    if ($corpo.Contains('senha_hash')) { throw 'Resposta nao pode expor senha_hash.' }
    return $json
}

function Novo-Cpf {
    do { $digitos = @(1..9 | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 }) }
    while (($digitos -join '') -match '^(\d)\1{8}$')
    foreach ($tamanho in @(9, 10)) {
        $soma = 0
        for ($i = 0; $i -lt $tamanho; $i++) { $soma += $digitos[$i] * ($tamanho + 1 - $i) }
        $resto = ($soma * 10) % 11
        if ($resto -eq 10) { $resto = 0 }
        $digitos += $resto
    }
    return ($digitos -join '')
}
