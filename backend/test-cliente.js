
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

async function testar() {
  const resposta = await fetch(`${url}/rest/v1/clients`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      name: "Cliente Teste Morada",
      phone: `TESTE-${Date.now()}`
    })
  });

  if (!resposta.ok) {
    console.log("ERRO:", resposta.status, await resposta.text());
    return;
  }

  const dados = await resposta.json();
  console.log("CLIENTE CADASTRADO!");
  console.log("ID:", dados[0].id);
}

testar().catch(erro => console.log("ERRO:", erro.message));
