# Viva Amapá — App Vivo de Turismo do Amapá

Aplicação de turismo focada no **Estado do Amapá**, criada para ser apresentada ao **SENAC** como um projeto com potencial real de evolução.
Além de servir como guia turístico, o projeto foi pensado como um **“APP VIVO”**, onde futuramente os próprios usuários poderão **sugerir novos locais** (e até edições), com **aprovação de administradores** antes de publicar.

---

## ✨ Principais funcionalidades (MVP)

- Explorar locais com **filtros por cidade e categoria**
- Categorias essenciais:
  - **Balneários**
  - **Hotéis/Pousadas**
- Página de detalhes do local
- Mapa (visualização geográfica)
- Favoritos
- Roteiros (itinerários)
- **Sugerir novo local** (envio para moderação)
- **Painel de moderação (admin)** para aprovar ou rejeitar sugestões
- **Recomendação de locais próximos** (baseada em geolocalização)

---

## 🧩 Visão “App Vivo” (evolução)

- Usuários podem sugerir novos locais
- Admins/moderadores aprovam ou rejeitam antes de publicar
- (Futuro) Edição sugerida de locais existentes com fila de aprovação
- (Futuro) Denúncias, reputação de contribuidores, melhorias de qualidade de dados

---

## 🛠️ Tecnologias

- **React** + **Vite**
- **Tailwind CSS**
- **TanStack React Query**
- **React Router**
- **Supabase** (Auth + Database + Storage)
- **React Leaflet** (Mapa)

---

## ✅ Pré-requisitos

- Node.js (recomendado: versão LTS)
- NPM (ou Yarn/PNPM)

---

## ⚙️ Configuração do Supabase

### 1) Criar um projeto no Supabase
Crie um projeto no Supabase e copie:

- **Project URL**
- **Anon public key**

### 2) Criar arquivo de variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```bash
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI