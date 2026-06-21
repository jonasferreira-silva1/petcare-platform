# PetCare — Documento de Melhorias de Experiência

> Baseado no estado atual do projeto: autenticação, CRUD básico, mapa com Haversine, agendamento com ciclo pending → confirmed → completed/cancelled já funcionando entre os dois perfis.

Este documento detalha como evoluir a comunicação entre Tutor e Pet Shop, fechar lacunas de CRUD, e trazer pet shops reais para o mapa.

---

## 1. Pet shops reais no mapa (geolocalização de verdade)

Hoje o mapa mostra apenas pet shops cadastrados na sua própria base — ou seja, só aparece o que você mesmo criou. Para mostrar estabelecimentos **reais** próximos ao tutor, existem duas abordagens, com trade-offs diferentes:

### Opção A — Overpass API (OpenStreetMap, gratuito)
Você já usa Leaflet/OSM para o mapa, então faz sentido buscar dados de pet shops reais na mesma fonte.

- Endpoint: `https://overpass-api.de/api/interpreter`
- Query exemplo (Overpass QL) para buscar `shop=pet` num raio:
```
[out:json];
node["shop"="pet"](around:5000,-8.0476,-34.8770);
out;
```
- **Prós**: gratuito, sem limite de cota agressivo, já alinhado com a stack atual (Leaflet + OSM).
- **Contras**: cobertura de dados varia por região — Recife pode ter poucos pet shops mapeados no OSM comparado ao Google. Dados às vezes desatualizados (telefone, horário).
- **Como integrar**: criar uma Server Action `discoverRealPetshops(lat, lng, radius)` que chama Overpass, normaliza o resultado (nome, lat/lng, endereço quando disponível) e mescla com os pet shops cadastrados na sua base, marcando visualmente a diferença (ex: pin cinza = "não cadastrado no PetCare", pin colorido = "cadastrado, pode agendar").

### Opção B — Google Places API (Nearby Search)
- Mais completo (fotos, avaliações, horário de funcionamento, telefone confiável).
- **Contras**: pago após cota gratuita, exige chave de API e configuração de billing — peso extra para um projeto de portfólio.

### Recomendação
Para portfólio, comece com **Overpass/OSM** (opção A) — é grátis, não exige cartão de crédito, e mantém a stack 100% coerente com o que você já documentou. Deixe o Google Places como "alternativa futura" no roadmap, citando o trade-off de custo. Isso também vira um ponto interessante para falar em entrevista: "avaliei duas fontes de dados geográficos e escolhi a gratuita por X razão".

### Diferenciação visual no mapa
- **Pet shop cadastrado no PetCare** → pin colorido, clicável, abre o diálogo de agendamento.
- **Pet shop real mas não cadastrado** → pin neutro/outline, ao clicar mostra "Esse estabelecimento ainda não está no PetCare" com um CTA tipo "Convidar este pet shop" (gera um link de cadastro pré-preenchido com nome/endereço — bom gancho de crescimento orgânico).

---

## 2. Comunicação entre os perfis

Hoje a comunicação é indireta: o status do agendamento muda e cada lado vê isso na própria tela. Falta troca de mensagens e notificação ativa. Sugestão de evolução em camadas, da mais simples para a mais robusta:

### Camada 1 — Observações estruturadas (rápido de implementar)
Já existe `observações_petshop` no modelo de agendamento (mencionado no escopo original). Garanta que:
- O pet shop pode adicionar observação ao confirmar/recusar/concluir (ex: "Traga a carteira de vacinação", "Pet com pelo muito embaraçado, banho vai demorar mais").
- O tutor vê essa observação destacada no card do agendamento, não escondida.

### Camada 2 — Chat por agendamento (recomendado como próximo passo real)
Um chat simples vinculado a cada `appointment`, não um chat genérico — isso simplifica o modelo e o caso de uso fica claro.

**Modelo de dados:**
```
Message
- id
- appointment_id (FK)
- sender_id (FK user)
- sender_role (tutor | petshop)
- content
- created_at
- read_at (nullable)
```

**Server Actions:**
- `sendMessage(appointmentId, content)` — valida que o usuário autenticado é tutor ou petshop dono daquele agendamento.
- `getMessages(appointmentId)` — retorna histórico ordenado.
- `markAsRead(appointmentId)` — atualiza `read_at` para mensagens do outro lado.

**UI:**
- Dentro do card de agendamento (tanto na tela do tutor quanto do pet shop), um botão "Mensagens" abre um painel/drawer com o histórico e campo de envio.
- Badge de não lidas no card do agendamento e, idealmente, no item de menu do dashboard.

Isso não exige WebSocket de cara — pode começar com polling simples (revalidar a cada X segundos) ou `router.refresh()` ao focar a aba, e evoluir para tempo real depois se quiser usar isso como diferencial técnico (você já tem essa experiência do REC Flight Intelligence e do MetroRecife com Socket.io).

### Camada 3 — Notificações
- **In-app**: contador de notificações no dashboard (novo agendamento pendente para o pet shop; mudança de status para o tutor; nova mensagem para ambos).
- **E-mail** (já está no seu roadmap): use para eventos importantes, não para cada mensagem de chat — e-mail a cada mensagem de chat é invasivo. Reserve e-mail para: confirmação/recusa de agendamento, lembrete 24h antes, novo pedido pendente.

---

## 3. Perfil do Tutor — o que deve conter

### CRUD completo de Pet (hoje parece faltar update/delete explícito)
Confirme que existem as quatro operações:
- **Create**: formulário de cadastro (já existe).
- **Read**: listagem + detalhe do pet, incluindo histórico de atendimentos daquele pet específico (filtrar `appointments` por `pet_id`).
- **Update**: editar nome, raça, idade, porte, foto — hoje o README não menciona edição, só cadastro. Adicionar um botão "Editar" no card do pet abrindo o mesmo formulário pré-preenchido.
- **Delete**: excluir pet, com confirmação (dialog) e tratamento do que acontece com agendamentos antigos vinculados (soft delete é mais seguro que delete físico, para preservar histórico do pet shop).

### CRUD completo dos próprios dados do tutor
- Editar nome, telefone, endereço/localização (re-arrastar o pin).
- Excluir conta (com confirmação forte — "digite EXCLUIR para confirmar" é um padrão comum) e decisão clara sobre o que acontece com agendamentos futuros (cancelamento automático).

### Melhorias de experiência específicas do tutor
- **Histórico de atendimentos** mais rico: não só lista de agendamentos concluídos, mas timeline por pet (relevante para quem tem mais de um animal).
- **Favoritar pet shops**: tutor marca os 2-3 que mais usa, aparecem fixados no topo da busca.
- **Reagendar** em vez de só cancelar: ação que cancela o atual e abre o diálogo de booking pré-preenchido com o mesmo pet shop/serviço/pet.
- **Avaliação pós-atendimento** (já no seu roadmap): só liberar o formulário de review quando `status = completed`.

---

## 4. Perfil do Pet Shop — o que deve conter

### CRUD completo do estabelecimento e serviços
- Já existe upsert de perfil e serviços — confirme **delete** de serviço (com tratamento: serviço removido não pode ser usado em novos agendamentos, mas agendamentos antigos mantêm a referência histórica — soft delete/flag `ativo`).

### Visibilidade sobre os tutores
- Hoje o pet shop "vê que o usuário se cadastrou" — vale formalizar isso como uma **lista de clientes**: tutores que já agendaram pelo menos uma vez com aquele pet shop, com acesso ao histórico de pets e atendimentos daquele cliente específico (só os dados relevantes ao relacionamento, não tudo do tutor — cuidado com escopo de dados).
- Isso também viabiliza o pet shop **excluir/editar observações** em atendimentos passados (ex: corrigir uma nota de histórico).

### Mensagens e ações sobre agendamentos
- Confirmar / recusar (já existe).
- **Propor novo horário** em vez de só recusar — UX bem melhor que forçar o tutor a tentar de novo às cegas. Tecnicamente: ação que muda status para algo como `rescheduled_proposed` com um `proposed_at` novo, e o tutor aceita ou recusa a proposta.
- Enviar mensagem avulsa vinculada ao agendamento (camada 2 acima).
- Editar observações depois de concluído (ex: registrar reação do pet, recomendação de produto).

### Gestão de agenda (mencionado no escopo original, ainda não no README atual)
- Definir horários de funcionamento e bloqueios (folga, feriado) que limitam os horários disponíveis no diálogo de booking do tutor — hoje, sem isso, o tutor provavelmente pode agendar qualquer hora.
- Visualização tipo calendário/semana para o pet shop enxergar a agenda cheia, não só uma lista.

---

## 5. Resumo priorizado (o que fazer primeiro)

| Prioridade | Item | Esforço estimado |
|---|---|---|
| 1 | CRUD completo de Pet (update/delete) | Baixo |
| 2 | CRUD completo de perfil do Tutor + exclusão de conta | Baixo |
| 3 | Delete/soft-delete de serviço no Pet Shop | Baixo |
| 4 | Observações visíveis e destacadas no agendamento | Baixo |
| 5 | Chat por agendamento (Camada 2) | Médio |
| 6 | Pet shops reais via Overpass API no mapa | Médio |
| 7 | Lista de clientes para o Pet Shop | Médio |
| 8 | Propor novo horário em vez de só recusar | Médio |
| 9 | Gestão de horários de funcionamento/bloqueios | Médio-Alto |
| 10 | Notificações in-app + e-mail | Médio-Alto |

Os itens 1-4 fecham buracos de CRUD que pesam em qualquer avaliação técnica e são rápidos. O item 6 (pet shops reais) é o que mais aumenta a percepção de "produto de verdade" para quem testa a demo. O chat (item 5) é o que mais demonstra comunicação real entre os dois perfis, que era sua principal dúvida.