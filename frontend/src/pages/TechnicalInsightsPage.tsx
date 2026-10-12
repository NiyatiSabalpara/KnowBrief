import React from 'react';
import { 
  Cpu, 
  Layers, 
  GitBranch, 
  Brain, 
  Network, 
  FileText, 
  CheckCircle2, 
  Code2, 
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';

export const TechnicalInsightsPage: React.FC = () => {
  const pipelineStages = [
    {
      step: '01',
      title: 'News Retrieval & Source Ingestion',
      algorithm: 'Modular Source-Adapter Architecture + Feedparser + Trafilatura',
      description: 'Fetches live RSS feeds and web pages from FT, TOI, HT, BBC, Reuters, and The Hindu. Strips ads, cookies, and boilerplate navbars while preserving paragraphs and metadata.',
      runtime: 'Fast (I/O bounded)',
      icon: Layers,
      color: 'border-blue-500/30 text-blue-400'
    },
    {
      step: '02',
      title: 'Text Preprocessing & POS Tagging',
      algorithm: 'spaCy Linguistic Pipeline & NLTK Tokenizer',
      description: 'Performs whitespace normalization, sentence segmentation, tokenization, lemmatization, and Universal/Fine-Grained Part-of-Speech tagging.',
      runtime: '~8 - 15 ms',
      icon: Cpu,
      color: 'border-emerald-500/30 text-emerald-400'
    },
    {
      step: '03',
      title: 'Named Entity Recognition (NER)',
      algorithm: 'spaCy en_core_web_sm Entity Recognizer',
      description: 'Extracts and classifies grounded entities (PERSON, ORG, GPE, DATE, MONEY, PRODUCT, EVENT) with exact sentence context grounding and frequency counts.',
      runtime: '~10 - 20 ms',
      icon: Brain,
      color: 'border-purple-500/30 text-purple-400'
    },
    {
      step: '04',
      title: 'Multi-Method Keyword Extraction',
      algorithm: 'TF-IDF + TextRank (NetworkX) + Semantic KeyBERT',
      description: 'Calculates sublinear TF-IDF weights, constructs word co-occurrence graphs with PageRank centrality, and ranks candidate n-grams via vector space cosine distance.',
      runtime: '~12 - 25 ms',
      icon: Sparkles,
      color: 'border-amber-500/30 text-amber-400'
    },
    {
      step: '05',
      title: 'Domain Taxonomy Topic Classification',
      algorithm: 'Cosine Vector Space Taxonomy Classifier',
      description: 'Maps news text against 10 domain taxonomies (Technology, Business, Finance, Politics, Healthcare, Science, Environment, etc.) and computes calibrated confidence probabilities.',
      runtime: '~5 - 10 ms',
      icon: Zap,
      color: 'border-cyan-500/30 text-cyan-400'
    },
    {
      step: '06',
      title: 'Extractive Summarization',
      algorithm: 'TextRank Sentence Centrality Graph',
      description: 'Generates a sentence-to-sentence cosine similarity matrix, executes PageRank to score salience, and synthesizes Short, Medium, and Detailed extractive summaries.',
      runtime: '~10 - 20 ms',
      icon: FileText,
      color: 'border-rose-500/30 text-rose-400'
    },
    {
      step: '07',
      title: 'Event & Relation Extraction',
      algorithm: 'Syntactic Dependency Parsing & Verb-Argument Frames',
      description: 'Traverses dependency parse trees to discover Subject-Predicate-Object relations and structured events (Acquisitions, Launches, Investments, Appointments).',
      runtime: '~15 - 30 ms',
      icon: GitBranch,
      color: 'border-indigo-500/30 text-indigo-400'
    },
    {
      step: '08',
      title: 'Anaphora Coreference Resolution',
      algorithm: 'Entity-Grounded Heuristic Anaphora Clustered Chains',
      description: 'Resolves pronouns (he, she, they, it) and definite nominals (the company, the firm) to antecedent named entities across sentences.',
      runtime: '~5 - 12 ms',
      icon: Layers,
      color: 'border-teal-500/30 text-teal-400'
    },
    {
      step: '09',
      title: 'Knowledge Graph Construction',
      algorithm: 'NetworkX Multi-Directed Graph Engine',
      description: 'Transforms extracted SPO triples into directed labeled edges, calculates density and centrality metrics, and formats nodes for interactive Canvas visualization.',
      runtime: '~4 - 8 ms',
      icon: Network,
      color: 'border-emerald-500/30 text-emerald-400'
    }
  ];

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Code2 className="w-4 h-4" />
          <span>How it works</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Processing Pipeline</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          See how articles become summaries, entities, events, relationships, and knowledge graphs.
        </p>
      </div>

      {/* Flowchart Diagram */}
      <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 shadow-2xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>End-to-End Processing Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl glass-panel border ${stage.color} bg-slate-900/60 shadow-lg relative flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-extrabold text-slate-400">STAGE {stage.step}</span>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">{stage.title}</h4>
                  <p className="text-[10px] font-mono text-emerald-400 font-semibold mb-2">{stage.algorithm}</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{stage.description}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Latency:</span>
                  <span className="text-slate-200 font-bold">{stage.runtime}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extraction notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Honest Extraction & Paywall Handling</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            In adherence to real publisher policies, subscription-based sources such as <b>Financial Times</b> are respected. The system extracts all available RSS summaries, headlines, and public metadata. For full paywalled text, the user can paste authorized article content in the Analysis tab.
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            The application never manufactures false news articles, fake dates, or unsupported relationships.
          </p>
        </div>

        <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>NLP vs. LLM Summarization</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Unlike shallow applications that simply pass raw text to an external LLM API, this platform implements <b>classical and statistical NLP algorithms</b>: TF-IDF vectorization, TextRank sentence graph centrality with PageRank, syntactic dependency path traversal, and NetworkX knowledge graphs.
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every triple and event retains a direct pointer to its originating evidence sentence.
          </p>
        </div>
      </div>
    </div>
  );
};
