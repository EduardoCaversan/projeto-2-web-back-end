# Ambiente local pronto

Preparado em 08/11/2026: Node 22.12.0, MySQL Community Server 8.4.13, dependências instaladas e package-lock.json versionado. O ZIP veio de https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.13-winx64.zip e o MD5 foi conferido com a página oficial: 7b94489d5524dea9b27097068bea25a8.

O banco está em `.local/dados`, porta **3307**, vinculado apenas a **127.0.0.1**. Não foi instalado serviço global. `.env` contém senha aleatória de um usuário MySQL com SELECT/INSERT/UPDATE/DELETE somente em api_financas e chave JWT aleatória. A senha administrativa fica em `.local/admin.json`. Nenhum desses arquivos é versionado. Não copie o exemplo por cima do .env pronto.

Após encerrar/reiniciar a máquina, abra PowerShell na pasta api-financas e inicie o banco:

```powershell
$baseMysql = (Resolve-Path '.local/mysql-8.4.13-winx64').Path
$dadosMysql = (Resolve-Path '.local/dados').Path
& "$baseMysql/bin/mysqld.exe" --no-defaults "--basedir=$baseMysql" "--datadir=$dadosMysql" --bind-address=127.0.0.1 --port=3307 --mysqlx=0 --console
```

Deixe esse terminal aberto. Em outro terminal na mesma pasta:

```powershell
npm start
```

Se já estiverem rodando nesta sessão, use diretamente http://127.0.0.1:3000. Não inicie outra instância na mesma porta. Para encerrar o banco de forma controlada, em api-financas:

```powershell
node -e "const fs=require('node:fs'); const mysql=require('mysql2/promise'); (async()=>{const c=await mysql.createConnection(JSON.parse(fs.readFileSync('.local/admin.json','utf8'))); await c.query('SHUTDOWN'); await c.end();})().catch(e=>{console.error(e.code);process.exitCode=1;});"
```

Encerre a API com Ctrl+C no terminal em que a iniciou. Os dados são preservados. O seed já foi importado; não repetir a carga. A suíte de integração adicionou dois usuários fictícios; Ana/Bruno e seus dados continuam disponíveis para demonstração. Um banco separado, api_financas_verificacao, foi usado para conferir restrições e rollback; a trigger temporária foi removida após o teste.

Testes reproduzíveis:

```powershell
npm test
npm run test:http
$env:EXECUTAR_INTEGRACAO='1'
npm run test:integracao
Remove-Item Env:EXECUTAR_INTEGRACAO
```

Instalação em outra máquina continua descrita no README. A pasta .local e o .env não vão para o Git; cada pessoa cria seu próprio ambiente e segredos.
