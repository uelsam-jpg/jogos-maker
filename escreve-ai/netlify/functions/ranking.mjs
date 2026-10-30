import { getStore } from "@netlify/blobs";

// Soma das pontuações máximas das seis seções do jogo.
const PONTOS_MAX = 5200;
const PALAVROES = ["porra", "caralho", "merda", "puta", "viado", "buceta", "bosta", "foda", "piroca", "cacete", "arrombado", "babaca", "otario", "vagabund", "corno", "fdp", "vsf", "pqp", "nazi", "hitler"];

const resposta = (dados, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const limpaTurma = (t) => String(t || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

const proibido = (s) => {
  const n = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a");
  return PALAVROES.some((p) => n.includes(p));
};

// Cada jogador tem sua própria chave: duas pessoas salvando ao mesmo tempo não apagam uma à outra.
const chave = (turma, apelido) => `${turma || "SEM"}/${encodeURIComponent(apelido.toLowerCase())}`;

export default async (req) => {
  const store = getStore({ name: "ranking-escreve-ai", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const turma = limpaTurma(url.searchParams.get("turma"));
    const { blobs } = await store.list(turma ? { prefix: `${turma}/` } : {});
    const jogadores = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }))))
      .filter(Boolean)
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 20);
    return resposta({ jogadores });
  }

  if (req.method === "POST") {
    let dados;
    try {
      dados = await req.json();
    } catch {
      return resposta({ erro: "Dados inválidos." }, 400);
    }
    const apelido = String(dados.apelido || "").trim().replace(/\s+/g, " ");
    const turma = limpaTurma(dados.turma);
    const pontos = Math.round(Number(dados.pontos));
    if (apelido.length < 3 || apelido.length > 16 || !/^[\p{L}\p{N} ]+$/u.test(apelido) || proibido(apelido)) {
      return resposta({ erro: "Apelido inválido." }, 400);
    }
    if (!Number.isFinite(pontos) || pontos < 0 || pontos > PONTOS_MAX) {
      return resposta({ erro: "Pontuação inválida." }, 400);
    }
    const nivel = ["facil", "normal", "dificil"].includes(dados.nivel) ? dados.nivel : "normal";
    const k = chave(turma, apelido);
    const atual = await store.get(k, { type: "json" });
    if (!atual || pontos > atual.pontos) await store.setJSON(k, { apelido, turma, pontos, nivel });
    return resposta({ ok: true });
  }

  // Limpa o ranking de uma turma, ou todos se nenhuma for informada. Exige a chave do professor.
  if (req.method === "DELETE") {
    const segredo = Netlify.env.get("RANKING_CHAVE");
    if (!segredo || req.headers.get("x-chave-professor") !== segredo) {
      return resposta({ erro: "Chave incorreta." }, 403);
    }
    const turma = limpaTurma(url.searchParams.get("turma"));
    const { blobs } = await store.list(turma ? { prefix: `${turma}/` } : {});
    await Promise.all(blobs.map((b) => store.delete(b.key)));
    return resposta({ apagados: blobs.length });
  }

  return resposta({ erro: "Método não permitido." }, 405);
};

export const config = { path: "/api/ranking" };
