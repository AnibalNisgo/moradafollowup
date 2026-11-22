# Morada Follow-up MVP V01

## Consolidação da V01

- Funcionalidades comprovadas: atendimento automático pelo WhatsApp com Qwen local, histórico e deduplicação no Supabase, qualificação de nome/interesse/finalidade/endereço, console local em modo real ou demonstração e envio de follow-up programado. As evidências ponta a ponta anteriores estão nas seções abaixo.
- Verificação da consolidação: Vitest passou com 2 arquivos e 3 testes, TypeScript passou com `--noEmit` e a sintaxe do backend foi validada. Em leitura, frontend e backend responderam, o Ollama listou `qwen3.5:2b` e a API do console retornou WhatsApp conectado, cadastro qualificado e follow-up enviado. A consolidação não gerou novos envios nem novos cadastros.
- Operação local: WhatsApp Web depende de sessão conectada e de remetentes de teste autorizados. O console real usa a API local na porta 3002. Os erros gerais do WhatsApp ficam no log local. Falhas de follow-up ficam no Supabase. O prazo ajustado no console vale para os próximos agendamentos.
- Os scripts `backend/test-supabase.js` e `backend/test-cliente.js` são verificações manuais. O segundo insere um cliente de teste. A suíte automatizada atual está no frontend.
- Regras de Git protegem arquivos de ambiente, formatos usuais de chave privada e diretórios de sessão do WhatsApp. O backend tem seu próprio `package-lock.json`. Para o frontend, o `bun.lock` já versionado continua sendo a referência.

## Etapa 01 — Persistência validada

- Cliente fictício existente localizado no Supabase.
- Duas mensagens gravadas e lidas de volta, com remetente, conteúdo, cliente e instante conferidos.
- Repetir cada UUID manteve uma linha por mensagem. Teste realizado no banco configurado em `backend/.env`.
- Esquema existente: remetentes `cliente` e `assistente`, UUID como chave primária e ID WhatsApp com restrição única.

## Etapa 02 — Atendimento validado

- `POST /chat` com telefone criou um cliente fictício e persistiu duas mensagens do cliente e duas respostas do Qwen local. O segundo turno recuperou do histórico a palavra informada no primeiro.
- A repetição do segundo ID devolveu a resposta gravada e manteve quatro mensagens. Resumo e data da última interação conferidos no Supabase.
- O resumo usa o trecho da última mensagem do cliente. Outros campos cadastrais aguardam dados explícitos.
- Chamadas antigas com apenas `message` continuam disponíveis sem cadastro.

## Etapa 03 — Atendimento automático validado

- Ativação via `WHATSAPP_ENABLED=1` e `WHATSAPP_TEST_NUMBERS` com os números remetentes autorizados, em formato internacional, separados por vírgula.
- QR no terminal. Sessão e cache em `backend/whatsapp.local/`, ignorados pelo Git.
- A inicialização ultrapassou 30 segundos no sandbox. Fora do sandbox, o WhatsApp Web emitiu o evento de QR e o backend o encaminhou ao renderizador, com o conteúdo do QR suprimido no diagnóstico.
- Em 22/11/2026, o usuário informou `WhatsApp: conectado.`. O endpoint local `/health` respondeu na porta 3002. O pareamento foi informado pelo usuário.
- O usuário informou o envio de `Ola`. A porta 3002 continuava respondendo e o Supabase ainda apresentava apenas os dois registros com IDs de WhatsApp do teste simulado. A causa da ausência do evento real ainda não foi determinada.
- Adicionados diagnósticos de recebimento, resolução do remetente, lista de teste, duplicidade e confirmação de envio. O terminal mostra apenas a etapa, sem telefone, texto ou identificador da mensagem. Reiniciar a instância 3002 para aplicar.
- `Ola_2` chegou ao WhatsApp Web às 04h08 de 22/11/2026. A instância local na porta 3002 foi reiniciada com o remetente informado e reutilizou a sessão sem pedir QR. A mensagem real foi reprocessada individualmente pelo mesmo manipulador e o backend confirmou o envio e a persistência.
- Uma nova mensagem entrou automaticamente às 04h28min58s de 22/11/2026. O log registrou a autorização do remetente e o envio da resposta, persistida às 04h29min36s.
- Com transporte WhatsApp simulado e serviços reais de Qwen e Supabase, a duplicação da mensagem recebida produziu um único envio e dois registros. O teste também incluiu um grupo, mídia e um número fora da lista, sem envios adicionais.
- As quatro tabelas atuais não têm campo ou tabela para erros de integração. A integração grava diagnósticos em `backend/whatsapp.local/errors.log`. O registro desses erros no Supabase segue pendente.

## Etapa 04 — Follow-up validado

- O prazo vem de `settings.followup_days`. O cálculo soma dias de calendário em `America/Sao_Paulo`.
- Teste no Supabase com transporte simulado confirmou prazo com horário preservado, cancelamento, registro de falha e um único envio mesmo com dois verificadores concorrentes.
- O follow-up real da conversa `Ola_2` usou um prazo reduzido apenas para esse registro. Envio confirmado às 04h17 de 22/11/2026. No Supabase, um agendamento consta como `enviado` com uma mensagem do tipo `followup`.
- Envios interrompidos sem mensagem persistida são registrados como falha de entrega indeterminada para evitar reenvio automático.

## Etapa 05 — Console local validado

- O modo real usa `http://127.0.0.1:3002/api/console` e aparece somente no frontend em `localhost:8080` ou `127.0.0.1:8080`.
- A API confirmou conversa, resumo, conexão e retorno reais, e respondeu HTTP 403 a origens externas. O ajuste do prazo se aplica aos próximos agendamentos.
- Em um navegador com armazenamento isolado, o modo demonstração ocultou os registros reais. O modo real mostrou `Ola_2`, a resposta, o resumo cadastral, o status do WhatsApp e a linha do follow-up enviado. A interface alterou o prazo e o valor original foi restaurado e confirmado na API.
- TypeScript e os dois testes existentes da regra de demonstração passaram.

## Etapa 06 — Fluxos integrados validados

- Após novo reinício do backend, a sessão reconectou e o retorno enviado manteve uma única mensagem no banco. A reentrega do evento de `Ola_2` foi identificada como duplicada e ignorada.
- A API do console respondeu HTTP 200 com WhatsApp conectado e exibiu a nova entrada automática, a resposta e o novo follow-up programado para 25/11/2026 às 04h29min36s, horário de São Paulo. O retorno controlado do ciclo anterior segue registrado como enviado.

## Correção da qualificação do cadastro

- Causa confirmada em `backend/atendimento.js`. O fluxo persistia a conversa e atualizava o resumo, sem gravar os dados cadastrais reconhecidos.
- O módulo `backend/qualificacao.js` extrai nome, interesse e finalidade explícitos do texto recebido. O atendimento compartilhado por WhatsApp e `/chat` preenche apenas campos vazios, antes de chamar o Qwen.
- A mensagem histórica “Meu nome é Carlos, procuro uma casa em Itapoá para morar.” preencheu `Carlos`, `Casa em Itapoá` e `Moradia` no cadastro original. O endereço continuou nulo. As sete mensagens permaneceram idênticas, verificadas por comparação de SHA-256 antes e depois.
- Um teste pelo `/chat` com cliente fictício confirmou os três campos no Supabase, resposta do Qwen e duas mensagens mesmo após repetir a requisição com o mesmo ID. Um teste adicional validou que os campos já preenchidos foram preservados.
- A API local retornou os três campos com HTTP 200. A ficha no console em modo real exibiu `Carlos` e `Casa em Itapoá · Moradia`. A instância 3002 foi reiniciada com a correção e reconectou ao WhatsApp.

## Correção do endereço

- `backend/qualificacao.js` passou a extrair endereços explícitos em declarações como “Meu endereço é…” e “Moro na…”. A gravação existente preenche somente endereço nulo ou vazio.
- A mensagem original do WhatsApp preencheu `Rua Teste, 123, Itapoá` no cadastro de Carlos. A repetição da atualização manteve os demais campos, as nove mensagens e os quatro follow-ups idênticos.
- Testes de extração cobriram declaração de endereço, residência com rua e avenida abreviada, frase negada e mensagem sem endereço. A API retornou HTTP 200 e a ficha em modo real exibiu o endereço. A instância 3002 reconectou ao WhatsApp após carregar a correção.

## Retomada local

A instância 3002 está ativa em segundo plano. Os diagnósticos desta execução estão em `backend/whatsapp.local/backend-3002.log`. O comando abaixo fica como referência para retomada local.

```powershell
$env:WHATSAPP_ENABLED = '1'
$env:WHATSAPP_TEST_NUMBERS = '<numero-remetente-de-teste-com-DDI-e-DDD>'
$env:PORT = '3002'
& 'C:\Program Files\nodejs\node.exe' 'C:\Morada\backend\index.js'
```
