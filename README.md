# Poli Iniciativas

Crie o MVP de uma plataforma web de gestão de iniciativas para o Grêmio Politécnico da USP. O aplicativo deve ser focado em simplicidade visual e experiência fluida.

Siga estritamente as diretrizes de System Design abaixo:

- Cores: Azul Escuro Politécnico (#0B2545) para elementos principais/headers, Branco/Cinza Claro (#F8F9FA) para o fundo, Texto Principal (#1D2D44) e Laranja de Destaque (#EE9B44) para botões de ação principal (CTAs).

- Tipografia: Inter ou sans-serif moderna, limpa e corporativa.

REQUISITOS DE FUNCIONALIDADE:

1. Autenticação (SSO): Na primeira tela, exiba uma página de login limpa com a identidade do Grêmio e um botão de "Entrar com o Google" (Simular o fluxo de Login Social / Google SSO).

2. Tela Inicial (Layout Estilo Netflix): Após o login, a tela inicial deve ser um catálogo vertical com rolagem horizontal (carrossel de cards) para as categorias.

   - Linha 1: "Iniciativas em Andamento" (Carrossel horizontal)

   - Linha 2: "Iniciativas Passadas" (Carrossel horizontal)

3. Botão "Nova Iniciativa": Um botão flutuante ou de destaque no topo direito (em Laranja #EE9B44) escrito "+ Nova Iniciativa". No momento, ao clicar nele, exiba apenas um modal simples ou feedback de "Em breve: Ingestão de Propostas".

DADOS MOCKADOS (Crie dados fictícios realistas para popular o catálogo):

- Para "Iniciativas em Andamento": Crie pelo menos 4 cards. Exemplos: "Semana de Engenharia 2026", "InterPoli", "Reforma do Triedro", "Curso Poliglota - Intensivo". Cada card deve ter o nome, uma tag de categoria (ex: Evento, Infraestrutura, Cultura), a data estimada e uma foto/placeholder bonita de fundo.

- Para "Iniciativas Passadas": Crie pelo menos 4 cards de projetos antigos concluídos com visual ligeiramente esmaecido ou tag de "Concluído". Exemplos: "SAPO 2025", "Hackathon Poli-USP", "Bolsas de Idiomas Q1", "Festa do Biênio".

Gere o código frontend completo, modular e interativo com dados mockados prontos para visualização imediata.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/03a9ba2c-56d9-458e-89b6-6008ab8275cb).

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
