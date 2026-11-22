const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

async function testar() {
  try {
    const resposta = await fetch(
      `${url}/rest/v1/settings?select=id,followup_days`,
      { headers: { apikey: key } }
    );

    if (!resposta.ok) {
      console.log("Erro de conexão:", resposta.status);
      return;
    }

    const dados = await resposta.json();
    console.log("SUPABASE CONECTADO!");
    console.log("Configurações:", dados);

  } catch (erro) {
    console.log("Erro:", erro.message);
  }
}

testar();