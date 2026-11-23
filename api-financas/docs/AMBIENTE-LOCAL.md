# MySQL portátil nesta máquina

MySQL Community Server 8.4.13 em .local/mysql-8.4.13-winx64, dados em .local/dados, porta **3307**, host **127.0.0.1**. Não há serviço global nem cliente mysql no PATH. .env e .local/admin.json estão configurados e não são versionados.

Na pasta api-financas, após reiniciar a máquina:

```powershell
$baseMysql = (Resolve-Path '.local/mysql-8.4.13-winx64').Path
$dadosMysql = (Resolve-Path '.local/dados').Path
& "$baseMysql/bin/mysqld.exe" --no-defaults "--basedir=$baseMysql" "--datadir=$dadosMysql" --bind-address=127.0.0.1 --port=3307 --mysqlx=0 --console
```

Deixe o terminal do MySQL aberto. Em outro PowerShell na mesma pasta:

```powershell
.\iniciar.ps1
```

Swagger: http://localhost:3000/api-docs. Ctrl+C encerra a API. Bancos de teste ficam preservados; não reimporte seed sobre tabelas existentes.

Cliente portátil:

```powershell
$mysql = (Resolve-Path '.local/mysql-8.4.13-winx64/bin/mysql.exe').Path
& $mysql --host=127.0.0.1 --port=3307 -u root -p
```

Para encerrar o MySQL de forma controlada, após encerrar a API:

```powershell
node -e "const fs=require('node:fs');const mysql=require('mysql2/promise');(async()=>{const c=await mysql.createConnection(JSON.parse(fs.readFileSync('.local/admin.json','utf8')));await c.query('SHUTDOWN');await c.end();})().catch(e=>{console.error(e.code);process.exitCode=1;});"
```

Configuração de outra máquina, instalação e testes: [README](../README.md). Portas e caminhos deste documento são locais; a porta padrão de outra instalação pode ser 3306.
