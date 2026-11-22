# MoradaImoveis

DESENVOLVIMENTO — MVP DE ATENDIMENTO IMOBILIÁRIO COM IA



Atue como desenvolvedor Full Stack Sênior e Product Designer especializado em sistemas SaaS, interfaces administrativas e automação de atendimento por inteligência artificial.



OBJETIVO



Crie um frontend profissional, moderno e funcional para apresentar um MVP de atendimento imobiliário inteligente via WhatsApp.



O sistema terá apenas duas funções principais:



1. Atendimento e qualificação: registrar automaticamente as conversas, identificar o cliente, coletar seus dados e gerar um resumo do atendimento.

2. Follow-up automático: identificar clientes sem retorno após X dias e programar uma nova mensagem no mesmo horário da última interação.



IMPORTANTE: Esta primeira entrega é uma demonstração visual e interativa. Não implementar integrações reais com WhatsApp, serviços de IA ou banco externo. Utilizar dados fictícios e simulações funcionais.



IDENTIDADE VISUAL



Nome provisório: Atende.IA



Criar uma interface premium, minimalista e corporativa.



- Estilo inspirado em CRMs modernos como Linear, Attio e plataformas SaaS profissionais.

- Fundo claro, branco e cinza muito suave.

- Azul-petróleo como cor principal, verde discreto para WhatsApp e estados positivos.

- Tipografia Inter, excelente legibilidade.

- Componentes com bordas suaves, espaçamento consistente e ícones Lucide.

- Layout responsivo, com sidebar e área principal.

- Visual sofisticado, sem excesso de cartões, gradientes ou elementos decorativos.

- Todo o conteúdo em português brasileiro.



O sistema deve parecer um produto real, pronto para apresentação comercial, não uma landing page ou um painel genérico.



TELA 1 — VISÃO GERAL



Dashboard com:



Indicadores:



- Clientes cadastrados.

- Atendimentos realizados.

- Conversas aguardando resposta.

- Follow-ups programados.



Abaixo:



- Lista de atendimentos recentes.

- Próximos follow-ups.

- Clientes com retorno pendente.



Mostrar dados fictícios coerentes e atualizados conforme interações feitas na demonstração.



TELA 2 — CLIENTES



Criar uma tabela profissional com:



- Nome do cliente.

- Telefone.

- Endereço informado.

- Interesse identificado.

- Data e hora do último contato.

- Status do atendimento.

- Próximo follow-up.



Permitir busca, filtro por status e seleção do cliente.



Ao clicar em um cliente, abrir seu cadastro detalhado.



Cadastro detalhado



Exibir:



- Nome e telefone.

- Endereço.

- Contexto/interesse imobiliário.

- Data do primeiro contato.

- Data do último contato.

- Resumo automático gerado pela IA.

- Histórico integral de mensagens, com data, hora e identificação do remetente.

- Situação do próximo follow-up.



Campos não informados devem aparecer como "Não informado", nunca inventados automaticamente.



Permitir editar os dados cadastrais.



TELA 3 — CENTRAL DE ATENDIMENTOS



Criar interface de conversas semelhante ao WhatsApp Web, porém integrada ao CRM:



Coluna esquerda: lista de conversas, nome, última mensagem, horário e status.



Área central: histórico completo das mensagens, distinguindo claramente cliente e assistente de IA.



Painel lateral direito: informações extraídas automaticamente durante a conversa:



- Identificação do cliente.

- Telefone.

- Endereço.

- Interesse.

- Resumo do atendimento.

- Última interação.

- Próximo follow-up.



Criar uma demonstração interativa:



O usuário digita uma mensagem como cliente.



Uma IA simulada responde de maneira natural, objetiva e profissional, seguindo respostas pré-configuradas e coerentes com o contexto.



Exemplo:



Cliente: "Olá, estou procurando uma casa em Itapoá."



Assistente: "Olá! Posso ajudar. Você procura uma casa para morar ou investir?"



Cliente: "Para morar, próximo à praia."



Assistente: "Entendi. Qual é o seu nome?"



À medida que as informações forem fornecidas, o painel lateral deve atualizar automaticamente.



A simulação não deve afirmar que está conectada a uma IA real.



TELA 4 — FOLLOW-UP



Criar interface simples e objetiva para visualizar os retornos.



Tabela:



- Cliente.

- Último contato.

- Dias sem resposta.

- Data e hora prevista para retorno.

- Status: programado, pendente ou concluído.



Regra configurável:



"Se o cliente não responder durante [3] dias após a última mensagem enviada pelo atendimento, programar uma mensagem de retorno."



O número de dias deve ser editável.



O retorno deve ser agendado para o mesmo horário da última mensagem enviada pelo atendimento.



Se o cliente responder antes, cancelar o retorno pendente e atualizar o atendimento.



Criar botão "Simular follow-up" que adicione uma mensagem fictícia ao histórico, altere o status e registre a data e hora da simulação.



Não enviar mensagens reais.



FUNCIONALIDADES DA DEMONSTRAÇÃO



Implementar:



1. Navegação funcional entre todas as telas.

2. Dados iniciais fictícios de pelo menos 8 clientes.

3. Visualização individual de históricos de conversas.

4. Simulação de atendimento e registro de novas mensagens.

5. Atualização dos dados identificados no cadastro.

6. Geração simulada de resumo conforme as mensagens.

7. Configuração do prazo de follow-up.

8. Simulação do envio de follow-up.

9. Persistência de dados no localStorage para evitar perda ao atualizar a página.

10. Botão discreto "Restaurar demonstração" para voltar aos dados iniciais.



Todas as ações demonstrativas devem produzir resultados visíveis na interface.



Evitar botões sem função, telas vazias, placeholders e funcionalidades apenas decorativas.



ARQUITETURA



Preferir React, TypeScript, Tailwind CSS e componentes shadcn/ui.



Organizar o código em componentes reutilizáveis, separando claramente:



- Interface.

- Dados dos clientes.

- Histórico de mensagens.

- Regras de follow-up.

- Camada simulada de atendimento.



Preparar a estrutura para substituição futura dos dados fictícios pelo Supabase, do atendimento simulado por um modelo de IA e da interface de mensagens pela integração com WhatsApp.



Não configurar essas integrações agora.



LIMITES DE ESCOPO



Não criar:



- Gestão financeira.

- Funil de vendas complexo.

- Cadastro de imóveis.

- Disparos em massa.

- Gestão de equipes.

- Assinaturas ou pagamentos.

- Autenticação.

- Automação com n8n.

- Integrações reais.



Não transformar o MVP em um CRM imobiliário completo.



RESULTADO ESPERADO



Entregar uma aplicação navegável, visualmente refinada e consistente, que permita demonstrar em aproximadamente três minutos:



1. Um cliente envia uma mensagem.

2. O assistente responde e registra informações.

3. Os dados e o histórico aparecem no cadastro.

4. O sistema programa um follow-up.

5. O usuário simula o retorno e visualiza o registro.



Priorizar qualidade da experiência, funcionamento dos fluxos e clareza visual. Não criar funcionalidades adicionais.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://moradafollowup.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5b6d29d9-9325-4300-b2ec-46dc2702babf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
