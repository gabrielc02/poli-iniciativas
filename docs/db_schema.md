# Modelagem do Banco de Dados - Supabase (PostgreSQL)

## Tabelas Principais

### 1. membros
Pessoas internas que fazem parte do projeto/organização.
* `id`: uuid (Primary Key, default: gen_random_uuid())
* `nome`: text (Obrigatório)
* `cargo`: text (Ex: 'Coordenador', 'Diretor', 'Membro')
* `curso`: text (Obrigatório - Ex: 'Engenharia de Computação', 'Administração')
* `ano_ingresso_curso`: integer (Obrigatório - Ex: 2024)
* `email`: text (Único, obrigatório)
* `telefone`: text
* `data_adesao`: date (default: now())

### 2. parceiros
Empresas, instituições ou contatos externos (leads ou parceiros ativos).
* `id`: uuid (Primary Key, default: gen_random_uuid())
* `nome_organizacao`: text (Obrigatório)
* `ponto_de_contato`: text (Nome da pessoa física de contato)
* `ramo`: text (Opcional - Ex: 'Tecnologia', 'Educação', 'Alimentos')
* `linkedin`: text (Opcional)
* `email`: text
* `telefone`: text
* `status`: text (Ex: 'Prospecção', 'Negociando', 'Ativo')
* `observacoes`: text

### 3. iniciativas
Grandes projetos ou frentes de trabalho.
* `id`: uuid (Primary Key, default: gen_random_uuid())
* `nome`: text (Obrigatório)
* `descricao`: text
* `status`: text (Ex: 'Planejamento', 'Em Andamento', 'Concluído')
* `categoria`: text (Ex: 'Social', 'Marketing', 'Tecnologia')
* `custo_id`: uuid (Opcional - link para futura tabela de custos)
* `data_inicio`: date (Obrigatório)
* `data_fim`: date (Opcional/Anulável)

### 4. tarefas
Ações específicas mapeadas para os membros.
* `id`: uuid (Primary Key, default: gen_random_uuid())
* `membro_id`: uuid (Foreign Key -> membros.id)
* `titulo`: text (Obrigatório)
* `descricao`: text
* `prazo`: timestamp with time zone
* `status`: text (Ex: 'Pendente', 'Em Execução', 'Concluído')
* `comentarios`: text (Opcional - Notas ou atualizações sobre a tarefa)

---

## Tabelas de Relacionamento (Muitos para Muitos)

### 5. iniciativa_parceiros
Vincula um ou mais parceiros a uma iniciativa.
* `id`: uuid (Primary Key, default: gen_random_uuid())
* `iniciativa_id`: uuid (Foreign Key -> iniciativas.id, On Delete Cascade)
* `parceiro_id`: uuid (Foreign Key -> parceiros.id, On Delete Cascade)

### 6. iniciativa_membros (Antiga 'participantes')
Vincula os membros que fazem parte e trabalham em uma iniciativa.
* `id`: uuid (Primary Key, default: gen_random_uuid())
* `iniciativa_id`: uuid (Foreign Key -> iniciativas.id, On Delete Cascade)
* `membro_id`: uuid (Foreign Key -> membros.id, On Delete Cascade)
* `papel`: text (Ex: 'Coordenador', 'Voluntário', 'Executor')
