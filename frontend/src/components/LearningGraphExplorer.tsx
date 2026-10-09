import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DataSet } from 'vis-data';
import { Network, Options } from 'vis-network';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, CircleHelp, ExternalLink, Filter, Maximize, Minus, Plus, Search, X } from 'lucide-react';
import { GraphData, GraphEdge, GraphNode } from '../types';

type Props = { graphData: GraphData; height?: string };
type Fact = { edge: GraphEdge; subject: string; predicate: string; object: string; evidence: string; source?: string; sentence?: string };

const entityColors: Record<string, string> = {
  ORGANIZATION: '#3B82F6', ORG: '#3B82F6', PERSON: '#10B981', LOCATION: '#8B5CF6', 'LOCATION (GPE)': '#8B5CF6', GPE: '#8B5CF6',
  MONEY: '#F59E0B', PERCENT: '#F59E0B', PRODUCT: '#EC4899', EVENT: '#6366F1', DATE: '#14B8A6', DEFAULT: '#64748B', ENTITY: '#64748B'
};
const categoryNames: Record<string, string> = { ORGANIZATION: 'Organization', ORG: 'Organization', PERSON: 'Person', LOCATION: 'Location', 'LOCATION (GPE)': 'Location', GPE: 'Location', MONEY: 'Money', PERCENT: 'Money or percentage', PRODUCT: 'Product', EVENT: 'Event', DATE: 'Date', ENTITY: 'Other entity', DEFAULT: 'Other entity' };
const safeSentence = (fact: Omit<Fact, 'edge'>) => {
  const p = fact.predicate.trim().toLowerCase();
  const direct = new Set(['acquired', 'invested in', 'appointed', 'launched', 'located in', 'announced', 'owns', 'founded', 'partnered with', 'met with', 'signed', 'approved', 'rejected', 'joined', 'created', 'opened', 'closed', 'won', 'visited', 'said']);
  return direct.has(p) ? `${fact.subject} ${p} ${fact.object}.` : '';
};
const hasPronoun = (s: string) => /^(it|they|them|we|he|she|this|that|these|those|its|their|his|her)$/i.test(s.trim());

export const LearningGraphExplorer: React.FC<Props> = ({ graphData, height = '680px' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodeSetRef = useRef<DataSet<any> | null>(null);
  const edgeSetRef = useRef<DataSet<any> | null>(null);
  const [mode, setMode] = useState<'graph' | 'facts'>('graph');
  const [category, setCategory] = useState('ALL');
  const [query, setQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [connectedOnly, setConnectedOnly] = useState(false);
  const [hideIncomplete, setHideIncomplete] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [walkStep, setWalkStep] = useState<number | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  const categories = useMemo(() => Array.from(new Set(graphData.nodes.map(n => n.group))), [graphData.nodes]);
  const facts = useMemo<Fact[]>(() => graphData.edges.map(edge => {
    const subject = edge.data?.subject || graphData.nodes.find(n => n.id === edge.from)?.label || '';
    const object = edge.data?.object || graphData.nodes.find(n => n.id === edge.to)?.label || '';
    const predicate = edge.data?.predicate || edge.label || '';
    const evidence = edge.data?.evidence_sentence?.trim() || '';
    const fields = { subject, object, predicate, evidence, source: edge.data?.source_url };
    return { edge, ...fields, sentence: safeSentence(fields) };
  }), [graphData]);
  const visibleFacts = useMemo(() => facts.filter(f => !hideIncomplete || (f.subject.trim() && f.object.trim() && f.predicate.trim() && !hasPronoun(f.subject) && !hasPronoun(f.object))), [facts, hideIncomplete]);
  const visibleNodeIds = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = graphData.nodes.filter(n => (category === 'ALL' || n.group === category) && (!term || `${n.label} ${n.group}`.toLowerCase().includes(term)));
    if (connectedOnly && selectedNode) {
      const ids = new Set([selectedNode.id]);
      graphData.edges.forEach(e => { if (e.from === selectedNode.id) ids.add(e.to); if (e.to === selectedNode.id) ids.add(e.from); });
      return new Set(matches.filter(n => ids.has(n.id)).map(n => n.id));
    }
    return new Set(matches.map(n => n.id));
  }, [graphData, category, query, connectedOnly, selectedNode]);
  const shownEdges = useMemo(() => graphData.edges.filter(e => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to) && (!hideIncomplete || visibleFacts.some(f => f.edge.id === e.id))), [graphData.edges, visibleNodeIds, hideIncomplete, visibleFacts]);
  const chosenFact = selectedEdge ? facts.find(f => f.edge.id === selectedEdge.id) : null;
  const guideFact = facts.find(f => f.evidence && f.subject && f.object && f.predicate) || facts[0];
  const guideNode = guideFact ? graphData.nodes.find(n => n.id === guideFact.edge.from) : graphData.nodes[0];

  useEffect(() => {
    if (!containerRef.current) return;
    const nodes = new DataSet<any>(graphData.nodes.filter(n => visibleNodeIds.has(n.id)).map(n => ({
      id: n.id, label: n.label, title: `${n.label} · ${categoryNames[n.group] || n.group}`, group: n.group, value: n.size || 20,
      color: { background: n.color?.background || entityColors[n.group] || entityColors.DEFAULT, border: n.color?.border || '#333333', highlight: { background: n.color?.highlight || '#FDE047', border: '#FFFFFF' }, opacity: 1 },
      font: { color: '#F5F5F5', size: 14, face: 'Manrope, Arial', strokeWidth: 3, strokeColor: '#202020' }, shape: 'dot', borderWidth: 2
    })));
    const edges = new DataSet<any>(shownEdges.map(e => ({ id: e.id, from: e.from, to: e.to, label: e.label, title: e.title, arrows: 'to', color: { color: '#929292', highlight: '#FFD429', hover: '#FFD429', opacity: .8 }, font: { color: '#D4D4D4', size: 11, align: 'middle', background: '#202020', strokeWidth: 0 }, width: 1.5, selectionWidth: 2, smooth: { enabled: true, type: 'continuous', roundness: .25 } })));
    const options: Options = { autoResize: true, nodes: { shadow: false }, edges: { hoverWidth: 1 }, physics: { enabled: true, barnesHut: { gravitationalConstant: -4200, centralGravity: .22, springLength: 155, springConstant: .035, damping: .12, avoidOverlap: .75 }, stabilization: { iterations: 180 } }, interaction: { hover: true, tooltipDelay: 120, navigationButtons: false, keyboard: { enabled: true, bindToWindow: false }, multiselect: false } };
    const network = new Network(containerRef.current, { nodes, edges }, options);
    networkRef.current = network; nodeSetRef.current = nodes; edgeSetRef.current = edges;
    network.on('click', params => {
      if (params.nodes.length) { setSelectedNode(graphData.nodes.find(n => n.id === params.nodes[0]) || null); setSelectedEdge(null); }
      else if (params.edges.length) { setSelectedEdge(graphData.edges.find(e => e.id === params.edges[0]) || null); setSelectedNode(null); }
      else { setSelectedNode(null); setSelectedEdge(null); }
    });
    return () => { network.destroy(); networkRef.current = null; nodeSetRef.current = null; edgeSetRef.current = null; };
  }, [graphData, visibleNodeIds, shownEdges]);

  useEffect(() => {
    const nodeSet = nodeSetRef.current; const edgeSet = edgeSetRef.current; const network = networkRef.current;
    if (!nodeSet || !edgeSet || !network) return;
    const focusId = selectedNode?.id || (walkStep !== null ? guideNode?.id : undefined);
    const focusEdgeId = selectedEdge?.id || (walkStep !== null && walkStep > 0 ? guideFact?.edge.id : undefined);
    nodeSet.update(graphData.nodes.filter(n => visibleNodeIds.has(n.id)).map(n => {
      const relevant = !focusId || n.id === focusId || graphData.edges.some(e => (e.from === focusId && e.to === n.id) || (e.to === focusId && e.from === n.id));
      return { id: n.id, color: { background: n.color?.background || entityColors[n.group] || entityColors.DEFAULT, border: n.color?.border || '#333', highlight: { background: n.color?.highlight || '#FDE047', border: '#fff' }, opacity: relevant ? 1 : .18 }, font: { color: relevant ? '#F5F5F5' : '#747474', size: 14, face: 'Manrope, Arial', strokeWidth: 3, strokeColor: '#202020' } };
    }));
    edgeSet.update(shownEdges.map(e => { const selected = e.id === focusEdgeId; const relevant = !focusId || e.from === focusId || e.to === focusId; return { id: e.id, color: { color: selected ? '#FFD429' : '#929292', highlight: '#FFD429', hover: '#FFD429', opacity: relevant ? .85 : .12 }, width: selected ? 3 : 1.5 }; }));
    if (focusId && visibleNodeIds.has(focusId)) network.selectNodes([focusId]);
    if (focusEdgeId && shownEdges.some(e => e.id === focusEdgeId)) network.selectEdges([focusEdgeId]);
    else if (focusId) network.selectEdges([]);
  }, [graphData, selectedNode, selectedEdge, walkStep, guideNode, guideFact, visibleNodeIds, shownEdges]);

  useEffect(() => { if (walkStep !== null) { setSelectedNode(guideNode || null); setSelectedEdge(walkStep > 0 ? guideFact?.edge || null : null); } }, [walkStep, guideNode, guideFact]);

  const fit = () => networkRef.current?.fit({ animation: { duration: 350, easingFunction: 'easeInOutQuad' } });
  const zoom = (by: number) => { const network = networkRef.current; if (network) network.moveTo({ scale: network.getScale() * by }); };
  const clearSelection = () => { setSelectedNode(null); setSelectedEdge(null); setConnectedOnly(false); };
  const openGuide = () => { setWalkStep(null); setGuideOpen(true); };
  const startWalk = () => { setGuideOpen(false); setWalkStep(0); setSelectedNode(guideNode || null); };
  const closeWalk = () => { setWalkStep(null); clearSelection(); };
  const walkthrough = [
    { title: 'Step 1 · Find a circle', text: guideNode ? `This circle represents “${guideNode.label}”, identified in the article as ${categoryNames[guideNode.group] || guideNode.group}.` : 'This graph has no entities to explore yet.' },
    { title: 'Step 2 · Follow a line', text: guideFact ? `This line connects ${guideFact.subject} and ${guideFact.object}. It represents an extracted relationship.` : 'There is no relationship line available in this graph.' },
    { title: 'Step 3 · Read the arrow', text: guideFact ? `The arrow points from ${guideFact.subject} to ${guideFact.object}. The direction is part of the fact.` : 'An arrow shows which entity the relationship starts from and which it points to.' },
    { title: 'Step 4 · Read the relationship', text: guideFact ? (guideFact.sentence || `Subject: ${guideFact.subject} · Relationship: ${guideFact.predicate} · Object: ${guideFact.object}`) : 'Relationship labels describe how the connected entities are linked.' },
    { title: 'Step 5 · Check the evidence', text: guideFact?.evidence ? `The article says: “${guideFact.evidence}”` : 'No supporting sentence is attached to this relationship. Treat it as unverified and check the original article.' }
  ];
  const currentWalk = walkStep === null ? null : walkthrough[walkStep];
  const explain = chosenFact ? (chosenFact.evidence ? `The article sentence connects ${chosenFact.subject} with ${chosenFact.object} through “${chosenFact.predicate}”: “${chosenFact.evidence}”` : `The extracted relationship connects ${chosenFact.subject} with ${chosenFact.object} through “${chosenFact.predicate}”. No supporting sentence was attached, so check the source before relying on it.`) : selectedNode ? `${selectedNode.label} is classified as ${categoryNames[selectedNode.group] || selectedNode.group}. The connections shown here are the relationships extracted for this entity.` : '';
  const linkedEdges = selectedNode ? facts.filter(f => f.edge.from === selectedNode.id || f.edge.to === selectedNode.id) : [];

  return <section className="overflow-hidden rounded-2xl border border-[#414141] bg-[#202020] shadow-xl">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414141] px-4 py-3">
      <div><p className="text-sm font-semibold text-white">Explore the connections</p><p className="text-xs text-slate-400">{graphData.nodes.length} entities · {graphData.edges.length} relationships</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={openGuide} className="inline-flex items-center gap-2 rounded-lg border border-[#ffd429]/50 bg-[#ffd429]/10 px-3 py-2 text-xs font-semibold text-[#ffd429] hover:bg-[#ffd429]/20"><BookOpen size={15}/>How to Read This Graph</button>
        <div className="flex rounded-lg border border-[#444] p-0.5 text-xs"><button onClick={() => setMode('graph')} className={`rounded px-3 py-1.5 ${mode === 'graph' ? 'bg-[#383838] text-white' : 'text-slate-400'}`}>Visual Graph</button><button onClick={() => setMode('facts')} className={`rounded px-3 py-1.5 ${mode === 'facts' ? 'bg-[#383838] text-white' : 'text-slate-400'}`}>Read as Sentences</button></div>
      </div>
    </div>
    {instructionsVisible && <div className="flex items-start justify-between gap-3 border-b border-[#393939] bg-[#252525] px-4 py-2.5 text-xs text-slate-300"><p><span className="text-[#ffd429]">Start with a circle, follow a connecting arrow, and read the label.</span> Click a circle or line to inspect its details and supporting evidence.</p><button aria-label="Dismiss instructions" className="text-slate-400 hover:text-white" onClick={() => setInstructionsVisible(false)}><X size={15}/></button></div>}
    {graphData.nodes.length === 0 ? <div className="flex min-h-[340px] flex-col items-center justify-center gap-3 px-6 text-center"><CircleHelp size={34} className="text-[#ffd429]"/><h3 className="text-lg font-semibold text-white">There’s no graph to explore yet</h3><p className="max-w-md text-sm text-slate-400">Analyze a news article first. Its extracted entities and relationships will appear here with links to the sentences they came from.</p></div> : <>
      {mode === 'graph' ? <>
        <div className="flex flex-wrap items-center gap-2 border-b border-[#414141] px-3 py-2.5">
          <label className="relative min-w-[180px] flex-1"><Search size={14} className="absolute left-3 top-2.5 text-slate-500"/><input aria-label="Search entities" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search an entity…" className="w-full rounded-lg border border-[#444] bg-[#191919] py-2 pl-8 pr-3 text-xs text-white outline-none focus:border-[#ffd429]"/></label>
          <label className="flex items-center gap-2 rounded-lg border border-[#444] px-2.5 py-2 text-xs text-slate-300"><Filter size={13}/><select aria-label="Filter by entity category" value={category} onChange={e => setCategory(e.target.value)} className="max-w-40 bg-transparent text-xs text-slate-200 outline-none"><option value="ALL">All categories</option>{categories.map(c => <option key={c} value={c}>{categoryNames[c] || c}</option>)}</select></label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={hideIncomplete} onChange={e => setHideIncomplete(e.target.checked)}/>Hide incomplete facts</label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={connectedOnly} disabled={!selectedNode} onChange={e => setConnectedOnly(e.target.checked)}/>Show connections</label>
          <div className="ml-auto flex gap-1"><button title="Zoom out" aria-label="Zoom out" onClick={() => zoom(.8)} className="graph-control"><Minus size={15}/></button><button title="Zoom in" aria-label="Zoom in" onClick={() => zoom(1.25)} className="graph-control"><Plus size={15}/></button><button title="Fit to screen" aria-label="Fit to screen" onClick={fit} className="graph-control"><Maximize size={15}/></button><button title="Reset selection and filters" onClick={() => { clearSelection(); setCategory('ALL'); setQuery(''); setHideIncomplete(false); fit(); }} className="graph-control px-2 text-[11px]">Reset</button></div>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_250px]">
          <div className="relative min-w-0 border-b border-[#414141] lg:border-b-0 lg:border-r" style={{ height }}><div ref={containerRef} className="h-full w-full bg-[#1a1a1a]"/>{visibleNodeIds.size === 0 && <div className="absolute inset-0 grid place-items-center bg-[#1a1a1a]/90 p-6 text-center text-sm text-slate-300">No entities match this search or filter.</div>}
            {currentWalk && <div className="absolute bottom-3 left-3 right-3 z-10 mx-auto max-w-xl rounded-xl border border-[#ffd429]/50 bg-[#202020]/95 p-3 shadow-lg"><div className="flex items-start justify-between gap-3"><div><b className="text-sm text-[#ffd429]">{currentWalk.title}</b><p className="mt-1 text-xs leading-relaxed text-slate-200">{currentWalk.text}</p></div><button onClick={closeWalk} aria-label="Close walkthrough" className="text-slate-400"><X size={16}/></button></div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-slate-500">{walkStep! + 1} of 5</span><div className="flex gap-2">{walkStep! > 0 && <button onClick={() => setWalkStep(walkStep! - 1)} className="walk-button"><ArrowLeft size={13}/>Back</button>}<button onClick={closeWalk} className="walk-button">Skip</button>{walkStep! < 4 ? <button onClick={() => setWalkStep(walkStep! + 1)} className="walk-button walk-next">Next<ArrowRight size={13}/></button> : <button onClick={closeWalk} className="walk-button walk-next">Finish</button>}</div></div></div>}
            {selectedNode && !currentWalk && <div className="absolute right-3 top-3 z-10 max-h-[85%] w-[min(310px,calc(100%-24px))] overflow-y-auto rounded-xl border border-[#4c4c4c] bg-[#202020]/95 p-4 shadow-xl"><div className="flex justify-between gap-2"><div><span className="text-[10px] uppercase tracking-wide text-slate-400">{categoryNames[selectedNode.group] || selectedNode.group}</span><h3 className="mt-1 text-base font-semibold text-white">{selectedNode.label}</h3></div><button aria-label="Close details" onClick={clearSelection} className="text-slate-400"><X size={16}/></button></div><p className="mt-2 text-[11px] text-slate-400">Node size reflects how many relationships connect to it; it does not indicate truth or importance.</p><button className="mt-3 rounded-md border border-[#ffd429]/40 px-2.5 py-1.5 text-xs text-[#ffd429]" onClick={() => setShowExplanation(v => !v)}>Explain in Simple English</button>{showExplanation && <p className="mt-2 rounded-lg border border-[#414141] bg-[#191919] p-2.5 text-xs leading-relaxed text-slate-200">{explain}</p>}<h4 className="mt-3 text-xs font-semibold text-slate-200">Connected entities and facts</h4>{linkedEdges.length ? linkedEdges.map(f => <button key={f.edge.id} onClick={() => { setSelectedNode(null); setSelectedEdge(f.edge); }} className="mt-2 block w-full rounded-lg border border-[#414141] bg-[#191919] p-2 text-left text-xs text-slate-200 hover:border-[#ffd429]/60">{f.sentence || `${f.subject} · ${f.predicate} · ${f.object}`}<span className="mt-1 block text-[10px] text-slate-500">{f.evidence ? 'Evidence attached' : 'No evidence attached'}{f.source ? ` · ${(() => { try { return new URL(f.source).hostname || 'Source'; } catch { return 'Source'; } })()}` : ''}</span></button>) : <p className="mt-2 text-xs text-slate-500">No displayed facts connect to this entity.</p>}</div>}
            {chosenFact && !currentWalk && <div className="absolute right-3 top-3 z-10 max-h-[85%] w-[min(330px,calc(100%-24px))] overflow-y-auto rounded-xl border border-[#4c4c4c] bg-[#202020]/95 p-4 shadow-xl"><div className="flex justify-between"><div><span className="text-[10px] uppercase tracking-wide text-[#ffd429]">Extracted relationship</span><h3 className="mt-1 text-sm font-semibold text-white">{chosenFact.sentence || 'Structured relationship'}</h3></div><button aria-label="Close details" onClick={clearSelection} className="text-slate-400"><X size={16}/></button></div><dl className="mt-3 space-y-1 text-xs"><div><dt className="inline text-slate-500">Subject: </dt><dd className="inline text-slate-200">{chosenFact.subject || 'Not available'}</dd></div><div><dt className="inline text-slate-500">Relationship: </dt><dd className="inline text-slate-200">{chosenFact.predicate || 'Not available'}</dd></div><div><dt className="inline text-slate-500">Object: </dt><dd className="inline text-slate-200">{chosenFact.object || 'Not available'}</dd></div></dl><button className="mt-3 rounded-md border border-[#ffd429]/40 px-2.5 py-1.5 text-xs text-[#ffd429]" onClick={() => setShowExplanation(v => !v)}>Explain in Simple English</button>{showExplanation && <p className="mt-2 rounded-lg border border-[#414141] bg-[#191919] p-2.5 text-xs leading-relaxed text-slate-200">{explain}</p>}<h4 className="mt-3 text-xs font-semibold text-slate-200">Article evidence</h4><p className="mt-1 rounded-lg bg-[#191919] p-2.5 text-xs leading-relaxed text-slate-300">{chosenFact.evidence ? `“${chosenFact.evidence}”` : 'No supporting sentence was attached to this relationship. Check the original article before relying on it.'}</p>{chosenFact.source && <a href={chosenFact.source} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[#ffd429]">Open source article <ExternalLink size={12}/></a>}{(!chosenFact.evidence || !chosenFact.sentence || hasPronoun(chosenFact.subject) || hasPronoun(chosenFact.object)) && <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-200">This relationship may be incomplete or grammatically ambiguous. Check the original sentence before relying on it.</p>}</div>}
          </div>
          <aside className="p-3"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-slate-200">Node colors</h3><button aria-label="Explain node color categories" onClick={() => setLegendOpen(v => !v)} className="text-slate-400"><CircleHelp size={15}/></button></div>{legendOpen && <p className="mt-2 text-[10px] leading-relaxed text-slate-400">Each color marks the entity category assigned by the graph’s NLP data. Colors help distinguish types; they do not indicate importance or accuracy.</p>}<div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-2 lg:grid-cols-1">{Array.from(new Set(graphData.nodes.map(n => n.group))).map(cat => <div key={cat} className="flex items-center gap-2 text-[11px] text-slate-300"><span className="h-2.5 w-2.5 rounded-full" style={{ background: entityColors[cat] || entityColors.DEFAULT }}/>{categoryNames[cat] || cat}</div>)}</div><div className="mt-4 border-t border-[#414141] pt-3"><p className="text-[10px] leading-relaxed text-slate-500">Arrows point from subject to object. Relationship labels are machine-extracted and can be imperfect; check the evidence.</p></div><div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500"><span className="h-2.5 w-2.5 rounded-full bg-[#10B981]"/>More connections can make a node larger.</div></aside>
        </div>
        <details className="border-t border-[#414141] px-4 py-3"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-200"><ArrowDown size={14} className="text-[#ffd429]"/>Example: How to Read a Fact</summary>{guideFact ? <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2"><p><b className="text-white">Who?</b> {guideFact.subject}</p><p><b className="text-white">Relationship?</b> {guideFact.predicate}</p><p><b className="text-white">What?</b> {guideFact.object}</p><p><b className="text-white">Meaning</b> {guideFact.sentence || `Subject: ${guideFact.subject} | Relationship: ${guideFact.predicate} | Object: ${guideFact.object}`}</p><p className="sm:col-span-2"><b className="text-white">Evidence</b> {guideFact.evidence ? `“${guideFact.evidence}”` : 'No supporting sentence is available for this relationship.'}</p></div> : <p className="mt-3 text-xs text-slate-400">No relationship is available to demonstrate yet.</p>}</details>
      </> : <div className="max-h-[680px] space-y-3 overflow-y-auto p-4">{visibleFacts.length ? visibleFacts.map(f => <article key={f.edge.id} className="rounded-xl border border-[#414141] bg-[#191919] p-4"><p className="font-serif text-lg text-white">{f.sentence || `Subject: ${f.subject}  |  Relationship: ${f.predicate}  |  Object: ${f.object}`}</p><dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400"><div>Subject: {f.subject} {f.edge.from && <span>({categoryNames[graphData.nodes.find(n => n.id === f.edge.from)?.group || ''] || graphData.nodes.find(n => n.id === f.edge.from)?.group})</span>}</div><div>Relationship: {f.predicate}</div><div>Object: {f.object} {f.edge.to && <span>({categoryNames[graphData.nodes.find(n => n.id === f.edge.to)?.group || ''] || graphData.nodes.find(n => n.id === f.edge.to)?.group})</span>}</div></dl><p className="mt-3 border-l-2 border-[#ffd429]/50 pl-3 text-xs leading-relaxed text-slate-300">{f.evidence ? `“${f.evidence}”` : 'No supporting sentence was attached. Check the source before relying on this extracted fact.'}</p><div className="mt-3 flex items-center justify-between gap-2"><span className={`text-[10px] ${!f.evidence || hasPronoun(f.subject) || hasPronoun(f.object) ? 'text-amber-300' : 'text-slate-500'}`}>{!f.evidence || hasPronoun(f.subject) || hasPronoun(f.object) ? 'Check this extraction' : 'Extracted from article text; not independently verified'}</span>{f.source && <a href={f.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#ffd429]">Source <ExternalLink size={12}/></a>}</div></article>) : <p className="py-12 text-center text-sm text-slate-400">No relationships match the current filters.</p>}<label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={hideIncomplete} onChange={e => setHideIncomplete(e.target.checked)}/>Hide incomplete facts</label></div>}
      <div className="flex flex-wrap justify-between gap-2 border-t border-[#414141] px-4 py-2 text-[10px] text-slate-500"><span>{mode === 'graph' ? 'Click a node or line to inspect it.' : 'Statements are built from extracted relationships and their evidence.'}</span><span>{graphData.stats.total_nodes ?? graphData.nodes.length} nodes · {graphData.stats.total_edges ?? graphData.edges.length} relationships · node size = connection count</span></div>
    </>}
    {guideOpen && <div role="dialog" aria-modal="true" aria-labelledby="graph-guide-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onMouseDown={e => { if (e.target === e.currentTarget) setGuideOpen(false); }}><div className="w-full max-w-lg rounded-2xl border border-[#4a4a4a] bg-[#202020] p-5 shadow-2xl"><div className="flex justify-between"><div><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ffd429]">A quick guide</span><h2 id="graph-guide-title" className="mt-1 font-serif text-2xl text-white">How to Read This Graph</h2></div><button aria-label="Close graph guide" onClick={() => setGuideOpen(false)} className="text-slate-400"><X/></button></div><p className="mt-3 text-sm leading-relaxed text-slate-300">Circles are people, organizations, places, and other things named in an article. Lines connect them. The arrow shows direction, and the label says what relationship the system extracted.</p><div className="mt-4 grid grid-cols-2 gap-2">{[['Circle', 'An entity mentioned in the article.'], ['Arrow', 'Direction from subject to object.'], ['Label', 'The extracted relationship.'], ['Color', 'The entity category.']].map(([title, desc]) => <div key={title} className="rounded-lg border border-[#414141] bg-[#191919] p-3"><b className="text-xs text-white">{title}</b><p className="mt-1 text-[11px] text-slate-400">{desc}</p></div>)}</div><p className="mt-4 text-xs text-slate-400">Labels are automatically extracted and may be imperfect. Check the supporting article sentence before relying on a relationship. Larger circles have more connections, not greater importance.</p>{!guideFact && <p className="mt-3 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-200">There is no relationship available to demonstrate. Analyze an article with extracted facts first.</p>}<div className="mt-5 flex justify-end gap-2"><button onClick={() => setGuideOpen(false)} className="walk-button">Close</button><button onClick={startWalk} disabled={!guideNode} className="walk-button walk-next">Try the 5-step guide<ArrowRight size={14}/></button></div></div></div>}
  </section>;
};
