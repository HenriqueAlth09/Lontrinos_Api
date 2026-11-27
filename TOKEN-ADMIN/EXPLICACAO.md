# Token administrativo do Lontrinos

## O que e?
Um token unico e compartilhado entre os administradores autorizados. Ele libera somente as rotas que exigem permissao administrativa.

## Onde esta o token?
No arquivo `TOKEN-PRIVADO.txt` desta pasta. Esse arquivo e privado: nao envie ao GitHub, nao publique na Vercel e nao compartilhe com leitores.

## Como utilizar?
Em uma requisicao administrativa no Insomnia, na aba Auth, selecione Bearer Token e cole o token privado. O cabecalho enviado sera `Authorization: Bearer SEU_TOKEN`.

## O que significa criptografia aqui?
O token foi criado aleatoriamente. O backend guarda no `.env` somente o hash SHA-256 dele, na variavel `ADMIN_TOKEN_SHA256`. O hash serve para conferir o token sem guardar o valor original no codigo. Isso nao e criptografia reversivel: o hash nao permite recuperar o token.

## E os leitores?
Leitores continuam fazendo login individualmente e recebem JWT proprio. Isso permite identificar cada pessoa nas mensagens do chat. O token administrativo nao substitui o login dos leitores.

## Cuidados importantes
Quem tiver o token administrativo tera as mesmas permissoes de admin. Como ele e compartilhado, nao identifica qual administrador fez uma alteracao. Se for exposto, gere outro token e atualize o hash do `.env`, invalidando o anterior. Use HTTPS quando a API estiver publicada. Nunca coloque esse token no aplicativo Flutter distribuido aos leitores.

## Publicacao
Ao publicar, configure as variaveis do `.env` diretamente no painel da hospedagem. Nao envie o `.env` nem o arquivo `TOKEN-PRIVADO.txt` para um repositorio publico.
