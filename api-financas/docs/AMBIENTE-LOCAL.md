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

## Banco novo para cada ensaio, sem apagar o existente

Com o MySQL iniciado, execute em `api-financas`:

```powershell
npm install
node testes/preparar-demo.js
$env:DB_NAME = Get-Content .local/demo-banco.txt
npm run dev
```

Encerre antes a API que usa a mesma porta, com Ctrl+C no terminal dela. O auxiliar
usa `mysql2` já permitido e as credenciais administrativas locais; não exige cliente
MySQL no PATH. Lê `schema.sql` e `seed.sql`, troca apenas o nome do banco por um nome
novo, importa os dois scripts e concede ao usuário da API os quatro privilégios.
Não altera o schema versionado nem o `.env`, não apaga bancos e não imprime senhas.
`DB_NAME` do terminal prevalece sobre o `.env`. Ao terminar, Ctrl+C e
`Remove-Item Env:DB_NAME` restauram a seleção padrão para a próxima inicialização.

O arquivo `.local/admin.json` já existe nesta máquina. Em outra instalação, crie-o
**localmente**, com credenciais administrativas do seu MySQL, antes de usar o auxiliar:

```json
{"host":"127.0.0.1","port":3306,"user":"root","password":"SUBSTITUA_LOCALMENTE"}
```

Crie antes `.env` e a conta `financas` conforme README. O host da conta deve coincidir
com `DB_HOST` (`127.0.0.1` nos comandos documentados). O administrador precisa poder
criar bancos e conceder privilégios. Cada execução deixa um banco fictício independente;
a eventual remoção posterior cabe ao responsável, após conferir o nome. Não executar
o auxiliar durante testes concorrentes: ele atualiza `.local/demo-banco.txt`.

Para inspecionar pelo cliente portátil, use o caminho explícito e a porta correta:

```powershell
$mysql = (Resolve-Path '.local/mysql-8.4.13-winx64/bin/mysql.exe').Path
& $mysql --version
& $mysql --host=127.0.0.1 --port=3307 -u root -p
```

A senha de administrador está no arquivo privado acima; não o abra no projetor.
O fluxo com `preparar-demo.js` evita digitá-la ao vivo.
