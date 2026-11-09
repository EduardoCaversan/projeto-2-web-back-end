# Carregue com: . .\testes\comandos.ps1
# Usa arquivo UTF-8 para evitar diferencas de aspas do PowerShell 5.1/7.
$script:BaseApi = 'http://127.0.0.1:3000'
function Api {
    param(
        [Parameter(Mandatory=$true)][string]$Metodo,
        [Parameter(Mandatory=$true)][string]$Rota,
        $Dados = $null,
        [string]$Token = '',
        [int]$Esperado = 0
    )
    $argumentos = @('-sS', '--connect-timeout', '5', '--max-time', '15', '-X', $Metodo,
        "$script:BaseApi$Rota", '-H', 'Content-Type: application/json', '-w', "`n%{http_code}")
    if ($Token) { $argumentos += @('-H', "Authorization: Bearer $Token") }
    $arquivo = $null
    try {
        if ($null -ne $Dados) {
            $arquivo = [System.IO.Path]::GetTempFileName()
            $json = $Dados | ConvertTo-Json -Depth 10 -Compress
            [System.IO.File]::WriteAllText($arquivo, $json, (New-Object System.Text.UTF8Encoding($false)))
            $argumentos += @('--data-binary', "@$arquivo")
        }
        $saida = (& curl.exe @argumentos) -join "`n"
        if ($LASTEXITCODE -ne 0) { throw "curl.exe falhou: codigo $LASTEXITCODE. Verifique se a API iniciou." }
        $separador = $saida.LastIndexOf("`n")
        $status = $saida.Substring($separador + 1).Trim()
        Write-Host "HTTP $status - $Metodo $Rota"
        $corpo = $saida.Substring(0, $separador)
        if ($Esperado -and [int]$status -ne $Esperado) { throw "Esperado HTTP $Esperado, recebido $status em $Metodo $Rota. $corpo" }
        if ($corpo.Trim()) { return ($corpo | ConvertFrom-Json) }
    } finally {
        if ($arquivo) { Remove-Item -LiteralPath $arquivo -Force }
    }
}

# CPF ficticio com verificadores validos para repetir o cadastro da demo.
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
