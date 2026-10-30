# Conta Aí! Como publicar no Netlify

## Só o jogo, com ranking por aparelho
Arraste a pasta `conta-ai` para a área de deploy manual do Netlify.
O jogo funciona, mas o ranking mostra apenas quem jogou naquele aparelho, porque o deploy por arrastar não publica a função do ranking.

## Jogo com ranking online da turma
Escolha uma das opções:

**GitHub:** envie a pasta para um repositório e, no Netlify, use "Add new project > Import an existing project". As configurações já estão em `netlify.toml`.

**Linha de comando (precisa do Node.js instalado), dentro da pasta `conta-ai`:**

```bash
npm install
npx netlify-cli deploy --prod
```

## Limpar o ranking
1. No Netlify, crie a variável de ambiente `RANKING_CHAVE` com uma senha sua e publique de novo.
2. Rode o comando abaixo, trocando o endereço, a senha e a turma. Sem `?turma=`, ele apaga todas as turmas.

```bash
curl -X DELETE "https://SEU-SITE.netlify.app/api/ranking?turma=7A" -H "x-chave-professor: SUA-SENHA"
```

## Editar perguntas
As questões ficam nos geradores da constante `ger`, e as fases na constante `FASES`, no início do script de `index.html`.
Se mudar a quantidade de perguntas, atualize `PONTOS_MAX` em `netlify/functions/ranking.mjs`.

## Fixar o nível da turma
Compartilhe o link com `?nivel=` no final para os alunos não escolherem o nível:

- `https://SEU-SITE.netlify.app/?nivel=facil`
- `https://SEU-SITE.netlify.app/?nivel=normal`
- `https://SEU-SITE.netlify.app/?nivel=dificil`

Sem esse final, cada aluno escolhe o nível na tela inicial. Os ajustes de cada nível ficam na constante `DIFICULDADES`, em `index.html`.
