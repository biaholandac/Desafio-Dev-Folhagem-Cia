# Documento da API: Folhagem & Cia

API para controlar o estoque de plantas da loja Folhagem & Cia.

## Visão geral

A empresa Folhagem & Cia, precisava de ajuda para lidar melhor com o estoque. A loja controlava ele em uma planilha e já havia chegado a vender uma planta que nem existia mais.
Essa API serve para cadastrar, listar, editar, remover plantas do estoque, registrar as vendas, atualizar o estoque, e calcular o valor total dele. 

**Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL e Docker.

**Organização:** rotas (`routes.ts`) → controller (`PlantaController.ts`, valida e decide o status) → repository (`PlantaRepository.ts`, acessa o banco).

## Como rodar

**Pré-requisitos:** Docker Desktop (aberto, com "Engine running"), Node.js 20+ e Yarn.

```bash
git clone https://github.com/biaholandac/Desafio-Dev-Folhagem-Cia.git
cd Desafio-Dev-Folhagem-Cia
cp .env.example .env
yarn
docker compose up -d --build
yarn migration
yarn seed
```

O `yarn seed` é opcional: apaga as plantas existentes e cadastra 6 plantas de exemplo.

A API fica em `http://localhost:3001`.

## Modelo de dados

### Planta

| Campo | Tipo | Regra |
|---|---|---|
| `id` | Int | Gerado pelo banco |
| `nome` | String | Obrigatório, não vazio |
| `especie` | String | Obrigatório, não vazio |
| `preco` | Int | Em centavos, maior que zero (`8990` = R$ 89,90) |
| `estoque` | Int | Maior ou igual a zero (zero = esgotada) |
| `luminosidade` | Luminosidade | Um dos valores do enum |
| `petFriendly` | Boolean | `true` ou `false` |
| `regaACadaDias` | Int | Maior ou igual a 1 |
| `createdAt` / `updatedAt` | DateTime | Preenchidos automaticamente |

### Enum `Luminosidade`

`SOMBRA`, `MEIA_SOMBRA` ou `SOL_PLENO`.

## Rotas

| Método | Rota | O que faz | Sucesso |
|---|---|---|---|
| `POST` | `/plantas` | Cadastra uma planta | `201` |
| `GET` | `/plantas` | Lista as plantas, com filtros opcionais | `200` |
| `GET` | `/plantas/esgotadas` | Lista as plantas com estoque zero | `200` |
| `GET` | `/plantas/estoque/valor-total` | Valor total e total de vasos do estoque | `200` |
| `GET` | `/plantas/:id` | Busca uma planta | `200` |
| `PATCH` | `/plantas/:id` | Edita só os campos enviados | `200` |
| `DELETE` | `/plantas/:id` | Remove uma planta | `204` |
| `POST` | `/plantas/:id/venda` | Registra uma venda e diminui o estoque | `200` |

### POST /plantas

Todos os campos são obrigatórios.

Requisição:
```json
  {
    "nome": "Jiboia",
    "especie": "Epipremnum aureum",
    "preco": 3500,
    "estoque": 10,
    "luminosidade": "MEIA_SOMBRA",
    "petFriendly": false,
    "regaACadaDias": 4
  }
```

Resposta (`201`):
```json
{
  "id": 13,
  "nome": "Jiboia",
  "especie": "Epipremnum aureum",
  "preco": 3500,
  "estoque": 10,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 4,
  "createdAt": "2026-10-31T17:14:36.776Z",
  "updatedAt": "2026-10-31T17:14:36.776Z"
}
```

### GET /plantas

Filtros opcionais, que podem ser combinados:

| Filtro | Exemplo | O que faz |
|---|---|---|
| `luminosidade` | `?luminosidade=SOMBRA` | Só plantas com essa luminosidade |
| `petFriendly` | `?petFriendly=true` | `true` ou `false` |
| `nome` | `?nome=costela` | Nome contém o texto, sem diferenciar maiúsculas |
| `ordem` | `?ordem=preco` | Ordena por `preco` ou `nome` (crescente) |

Exemplo: `GET /plantas?luminosidade=SOMBRA&petFriendly=true&ordem=preco`

Resposta (`200`):
```json
[
  {
    "id": 8,
    "nome": "Calathea",
    "especie": "Calathea orbifolia",
    "preco": 6500,
    "estoque": 5,
    "luminosidade": "SOMBRA",
    "petFriendly": true,
    "regaACadaDias": 3,
    "createdAt": "2026-10-31T16:58:38.952Z",
    "updatedAt": "2026-10-31T16:58:38.952Z"
  }
]
```

Um filtro sem resultado devolve `200` com uma lista vazia `[]`.

### GET /plantas/esgotadas

Resposta (`200`): lista de plantas com `estoque` igual a `0`, no mesmo formato da listagem.

### GET /plantas/estoque/valor-total

Soma de `preco × estoque` de todas as plantas e total de vasos.

Resposta (`200`):
```json
{
  "valorTotalEmCentavos": 261380,
  "totalDeVasos": 55
}
```

### GET /plantas/:id

Resposta (`200`): a planta, no mesmo formato da resposta do cadastro.

### PATCH /plantas/:id

Envie só os campos que vão mudar. Eles passam pelas mesmas regras do cadastro.

Requisição:
```json
{ "preco": 7000 }
```

Resposta (`200`): a planta com os dados atualizados.

### DELETE /plantas/:id

Resposta (`204`): sem corpo.

### POST /plantas/:id/venda

Requisição:
```json
{ "quantidade": 2 }
```

Resposta (`200`): a planta com o estoque já atualizado.

## Erros e status HTTP

Todos os erros devolvem um JSON no formato `{ "message": "..." }`.

| Status | Quando acontece | Rotas |
|---|---|---|
| `400` | Campo obrigatório faltando no cadastro | `POST /plantas` |
| `400` | Campo com valor inválido (tipo errado, preço ≤ 0, estoque negativo, `regaACadaDias` < 1, luminosidade fora do enum) | `POST /plantas`, `PATCH /plantas/:id` |
| `400` | PATCH sem nenhum campo | `PATCH /plantas/:id` |
| `400` | Filtro inválido (`luminosidade` fora do enum, `petFriendly` diferente de `true`/`false`, `nome` vazio, `ordem` diferente de `preco`/`nome`) | `GET /plantas` |
| `400` | Id que não é um inteiro positivo (ex.: `/plantas/abc`) | Rotas com `:id` |
| `400` | `quantidade` que não é um inteiro maior ou igual a 1 | `POST /plantas/:id/venda` |
| `400` | Estoque insuficiente (nada é alterado) | `POST /plantas/:id/venda` |
| `404` | Planta com esse id não existe | Rotas com `:id` |
| `404` | Rota não existe | Qualquer rota desconhecida |
| `500` | Erro inesperado no servidor | Todas |

## Decisões e bônus

**Bônus implementados:** busca por nome, ordenação, rota de plantas esgotadas e seed.

- **Vendas simultâneas:** A conferência do estoque e o desconto são feitos numa única operação no banco (`updateMany` com a condição de estoque), então não dá tempo de outra venda passar no meio: se duas vendas do último vaso chegarem juntas, a primeira desconta o estoque e retorna 200, e a segunda, que já encontra o estoque insuficiente, retorna 400 sem alterar nada.
- **Validação antes do banco:** Todos os dados são conferidos no controller antes de chegar ao banco. Assim, um dado errado retorna 400, em vez de chegar ao banco e causar uma falha do sistema (500).
- **Ordem das rotas:** O Express usa a primeira rota que combina com o pedido, e o `:id` aceita qualquer texto. Por isso, a rota `/plantas/esgotadas` foi declarada antes de 
`/plantas/:id;` caso contrário, a palavra “esgotadas” seria lida como um id e a API retornaria 400 (id inválido).