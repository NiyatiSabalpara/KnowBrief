# AI News-to-Knowledge Converter

An academic news analysis application that turns article text into structured NLP outputs: summaries, named entities, keywords, topic labels, events, subject–predicate–object relationships, and interactive knowledge graphs. It combines a React and TypeScript frontend with a FastAPI backend, spaCy and scikit-learn components, and local SQLite persistence.

> This is a research and portfolio project. NLP outputs are automatically extracted and can be incomplete or incorrect; verify claims against the linked source text.

![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi&logoColor=white)

## Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Technology](#technology)
- [NLP pipeline](#nlp-pipeline)
- [Architecture](#architecture)
- [Setup](#setup)
- [Configuration](#configuration)
- [Using the app](#using-the-app)
- [Publisher access and limitations](#publisher-access-and-limitations)
- [Tests and checks](#tests-and-checks)
- [Known limitations and future work](#known-limitations-and-future-work)
- [Contributing](#contributing)
- [License](#license)

## Features

Implemented in the current codebase:

- Browse live article feeds from Financial Times, The Times of India, Hindustan Times, BBC News, Reuters, The Hindu, The Indian Express, TechCrunch, and CNBC; filter by publisher, topic, or search term.
- Ingest a public article URL with a readability extractor, or submit text directly when article access is restricted.
- Persist article and analysis records in SQLite and deduplicate feed results by normalized URL and title.
- Preprocess text and inspect token/POS samples.
- Extract entities with spaCy; rank terms with TF-IDF, TextRank, and a KeyBERT-style TF-IDF/cosine method.
- Classify topics with a hand-authored taxonomy and TF-IDF cosine similarity.
- Produce extractive TextRank summaries, heuristic event frames, dependency-based relationships, and rule-based coreference examples.
- Construct subject–predicate–object triples and NetworkX knowledge graphs.
- Compare analyzed articles using TF-IDF cosine similarity, shared entities and terms, event timelines, potential differences, and a combined graph.
- View analysis history and database-backed dashboard metrics.
- Export analysis as JSON, CSV (triples, entities, events), GraphML, and HTML.

API credential fields are placeholders only: NEWSAPI_KEY, OPENAI_API_KEY, and HUGGINGFACE_API_KEY are not currently consumed. No key is required for the implemented RSS and NLP flows.

## Screenshots

No screenshots are checked into the repository yet. After starting the app, use Windows Snipping Tool (or the OS screenshot shortcut) to capture the real Home/Discover, Article Analysis, Knowledge Graph, and Compare screens. Save the PNGs in a new screenshots directory as home.png, analysis.png, knowledge-graph.png, and compare.png, then add Markdown image references here. Do not present sample or fabricated articles as live reporting.

## Technology

| Area | Technologies | Purpose |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Axios | UI, styling, development/build, API requests |
| Graph and charts | vis-network, vis-data, Recharts | Interactive graph and dashboard charts |
| API | Python, FastAPI, Pydantic, Uvicorn | REST endpoints and schemas |
| NLP | spaCy, NLTK, scikit-learn, NumPy, NetworkX | Linguistic features, vectorization, similarity and graph algorithms |
| Ingestion | feedparser, httpx, Trafilatura, BeautifulSoup, lxml | RSS/Atom parsing and public-page extraction |
| Persistence | SQLite, SQLAlchemy | Local article and analysis storage |
| Containers | Docker Compose | Optional local launch |

## NLP pipeline

~~~mermaid
flowchart LR
    A[RSS article, URL, or pasted text] --> B[Feed retrieval or readability extraction]
    B --> C[Text cleanup, sentence splitting, token/POS inspection]
    C --> D[spaCy named entity recognition]
    C --> E[TF-IDF, TextRank, and KeyBERT-style keyword ranking]
    C --> F[TF-IDF cosine topic taxonomy]
    C --> G[TextRank extractive summaries]
    C --> H[Rule and dependency-based event extraction]
    C --> I[Dependency-based entity relationships]
    C --> J[Heuristic coreference examples]
    D --> K[SPO triples and evidence]
    H --> K
    I --> K
    K --> L[NetworkX graph and persisted analysis]
    L --> M[Interactive graph and multi-article comparison]
    C --> N[Financial pattern analysis]
~~~

“KeyBERT-style” is a candidate-term ranking method implemented with TF-IDF and cosine similarity; the KeyBERT package and transformer embeddings are not used. Summaries are extractive. Coreference, event, and relation extraction use rules and heuristics and should be reviewed.

## Architecture

~~~text
Browser (React/Vite)
  └── Axios requests to /api
       └── FastAPI routers
            ├── News service → RSS adapters / article extractor
            ├── Analysis service → NLP pipeline
            ├── Graph, comparison, dashboard, and export services
            └── SQLAlchemy → backend/knowledge_base.db (SQLite)
~~~

- frontend/src/pages: Home, Discover, Analysis, Graph, Compare, History, Insights, and Settings.
- frontend/src/components: shared navigation, charts, and graph visualization.
- frontend/src/services/api.ts: API client. Vite proxies /api to http://127.0.0.1:8000 in development.
- backend/app/api: FastAPI routes; backend/app/services: ingestion, persistence, and analysis orchestration.
- backend/app/news_sources: publisher adapters and article extraction.
- backend/app/nlp: preprocessing, extraction, summarization, comparison, and graph algorithms.
- backend/app/models, schemas, database: SQLAlchemy models, Pydantic schemas, and SQLite session.
- backend/tests: NLP, API, and live-feed tests.

The app creates its database tables during backend startup. The local database and downloaded model wheel are excluded from Git.

## Setup

### Prerequisites

- Python 3.11 (backend Dockerfile version)
- Node.js 20 and npm (frontend Dockerfile version)
- Network access to install dependencies, download the spaCy model, and retrieve public feeds

### Windows (PowerShell)

From the repository root:

~~~powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -c "import nltk; nltk.download('stopwords')"
python run.py
~~~

In a second terminal, from the repository root:

~~~powershell
cd frontend
npm ci
npm run dev
~~~

Open http://localhost:5173. The API is at http://127.0.0.1:8000 and its interactive docs are at http://127.0.0.1:8000/docs.

To configure the backend locally, copy .env.example to backend/.env before starting the backend. The default database is backend/knowledge_base.db; do not commit it.

### macOS / Linux

~~~bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -c "import nltk; nltk.download('stopwords')"
python run.py
~~~

In another terminal:

~~~bash
cd frontend
npm ci
npm run dev
~~~

### Docker Compose

If Docker is installed, run from the repository root:

~~~bash
docker compose up --build
~~~

The Compose file maps the frontend to localhost:5173 and the API to localhost:8000. The backend image downloads the spaCy model and NLTK resources during its build.

## Configuration

Copy .env.example to backend/.env for local backend configuration. The backend reads its environment file relative to its working directory.

| Variable | Example/default | Use |
| --- | --- | --- |
| PROJECT_NAME | AI News-to-Knowledge Converter | FastAPI title |
| VERSION | 1.0.0 | API version string |
| API_V1_STR | /api | API route prefix |
| DATABASE_URL | sqlite:///knowledge_base.db | SQLAlchemy database URL |
| BACKEND_CORS_ORIGINS | Local frontend origins | Allowed browser origins |
| REQUEST_TIMEOUT_SECONDS | 12 | Public article fetch timeout |

MAX_ARTICLE_CHARS is defined in settings but is not currently enforced. The API-key settings are unused placeholders.

## Using the app

1. Start the backend and frontend.
2. Browse/filter stories in Home or Discover News.
3. Choose Analyze Article for an accessible story. If a publisher blocks extraction, use the paste-text flow with text you are authorized to provide.
4. Review summaries, topic, entities, keywords, events, relationships, and technical processing details.
5. Explore extracted triples in the Knowledge Graph.
6. Select at least two analyzed articles in Compare Articles.
7. Reopen saved analyses in Saved Articles.
8. Use the analysis export controls for JSON, CSV, GraphML, or HTML.

## Publisher access and limitations

RSS availability, feed formats, network access, rate limits, and publisher rules can change. A feed may provide only a headline or summary. The URL extractor does not bypass paywalls or access controls. Full article text may be unavailable from Financial Times, Reuters, or other restricted publishers; use the paste-text feature for text you are authorized to provide. Receiving an RSS item does not guarantee that its full text can be analyzed.

## Tests and checks

Run the offline NLP and API tests from the backend directory:

~~~powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests\test_nlp_components.py tests\test_api_endpoints.py -q
~~~

Live publisher connectivity makes external requests and is intentionally separate:

~~~powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests\test_live_sources.py -s
~~~

Frontend checks:

~~~powershell
cd frontend
npm run lint
npm run build
~~~

During this preparation, the offline backend suite passed: 14 tests. The frontend production build passed. The linter exits successfully but reports warnings. Live publisher connectivity was not verified during this preparation.

## Known limitations and future work

- Publisher feed access and article extraction depend on network and publisher policy.
- spaCy's small English model and pattern-based extraction can miss entities, relationships, and nuance.
- Keyword “semantic” ranking is TF-IDF/cosine based; no transformer or KeyBERT model is used.
- Coreference uses rules and heuristics, not a learned coreference model.
- Topic classification uses a local taxonomy, not a trained supervised model.
- Comparison output flags potential differences; it does not establish that sources contradict each other.
- The live-source test depends on external publishers and may fail when feeds change or network access is unavailable.

Potential next steps include isolated database fixtures for API tests, improved source health reporting, stronger multilingual and relation/coreference models, evaluation of event extraction, and deployment guidance.

## Contributing

See CONTRIBUTING.md for setup, quality checks, and pull request guidance. Report bugs with reproduction steps and relevant logs; remove credentials and private article text before sharing logs.

## License

No license has been selected yet. Until a license is added, reuse and redistribution permissions are not granted by this repository.

