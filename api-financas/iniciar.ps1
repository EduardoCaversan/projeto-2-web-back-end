$ErrorActionPreference = 'Stop'
$api = $null
$bancoAnterior = $env:DB_NAME
$portaAnterior = $env:PORT
$codigo = 0
Push-Location $PSScriptRoot
try {
    $node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
    $npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
    if (!$node -or !$npm) { throw 'Instale Node.js 22+ com npm e abra outro PowerShell.' }
    $versao = & $node --version
    if ($LASTEXITCODE -ne 0 -or [int]$versao.TrimStart('v').Split('.')[0] -lt 22) { throw 'Este projeto exige Node.js 22 ou superior.' }
    if (!(Test-Path .env) -or !(Test-Path .local/admin.json)) { throw 'Configure .env e .local/admin.json conforme docs/AMBIENTE-LOCAL.md.' }
    if (!(Test-Path package-lock.json)) { throw 'package-lock.json ausente. Restaure o arquivo versionado.' }

    if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
        throw 'Porta 3000 ocupada. Encerre a API anterior no terminal dela ou libere a porta manualmente.'
    }

    & $node -e "const p=require('./package.json');try{for(const [n,v] of Object.entries({...p.dependencies,...p.devDependencies})){if(require('./node_modules/'+n+'/package.json').version!==v)process.exit(1)}}catch{process.exit(1)}"
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Instalando dependencias com npm ci, conforme package-lock.json...'
        & $npm ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'npm ci falhou. Confira acesso ao registry e tente novamente.' }
    }

    & $node testes/preparar-demo.js
    if ($LASTEXITCODE -ne 0) { throw 'Preparo falhou. Confira MySQL ligado, portas e configuracoes locais; veja a mensagem acima.' }
    $env:DB_NAME = (Get-Content .local/demo-banco.txt -Raw).Trim()
    if ($env:DB_NAME -notmatch '^api_financas_demo_[a-f0-9]{12}$') { throw 'Nome do banco de demonstracao invalido.' }
    $env:PORT = '3000'
    $api = Start-Process -FilePath $node -ArgumentList 'server.js' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput '.local/api-out.log' -RedirectStandardError '.local/api-erro.log'

    $pronta = $false
    for ($tentativa = 0; $tentativa -lt 20; $tentativa++) {
        if ($api.HasExited) { throw 'API encerrou durante a inicializacao. Consulte .local/api-erro.log.' }
        try { Invoke-WebRequest 'http://127.0.0.1:3000/auth/me' -UseBasicParsing -TimeoutSec 1 | Out-Null }
        catch { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) { $pronta = $true } }
        if ($pronta) { break }
        Start-Sleep -Milliseconds 250
    }
    if (!$pronta) { throw 'A API nao respondeu em tempo. Consulte .local/api-erro.log.' }
    if ($api.HasExited -or !(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Where-Object OwningProcess -eq $api.Id)) {
        throw 'A porta 3000 foi ocupada por outro processo durante a inicializacao.'
    }

    try {
        $login = Invoke-RestMethod 'http://127.0.0.1:3000/auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"ana@example.com","senha":"p@5sw0rd"}' -TimeoutSec 10
        $usuario = Invoke-RestMethod 'http://127.0.0.1:3000/auth/me' -Headers @{Authorization=('Bearer '+$login.token)} -TimeoutSec 10
        if ($usuario.email -ne 'ana@example.com') { throw 'Usuario inesperado.' }
    } catch { throw 'Verificacao de login/leitura falhou. Confira o log local da API e as credenciais do banco.' }
    $login = $null
    Write-Host "Pronto: http://127.0.0.1:3000 | Banco: $env:DB_NAME"
    Write-Host 'Swagger: http://127.0.0.1:3000/api-docs'
    Write-Host 'Mantenha este terminal aberto. Ctrl+C encerra somente esta API.'
    while (!$api.HasExited) { Start-Sleep -Milliseconds 250 }
    if ($api.ExitCode -ne 0) { throw 'API encerrou com erro. Consulte .local/api-erro.log.' }
} catch {
    Write-Host ('Falha: ' + $_.Exception.Message) -ForegroundColor Red
    $codigo = 1
} finally {
    if ($api -and !$api.HasExited) { Stop-Process -Id $api.Id -Force }
    $env:DB_NAME = $bancoAnterior
    $env:PORT = $portaAnterior
    Pop-Location
}
exit $codigo
