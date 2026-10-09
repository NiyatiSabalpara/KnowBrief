import React, { useEffect, useRef, useState } from 'react';
import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Pause, 
  Info, 
  Filter, 
  Download,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { GraphData, GraphNode, GraphEdge } from '../types';

interface KnowledgeGraphViewProps {
  graphData: GraphData;
  height?: string;
  onExportGraphML?: () => void;
  showExport?: boolean;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  graphData,
  height = '580px',
  onExportGraphML,
  showExport = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState<boolean>(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(graphData.nodes.map(n => n.group)))];

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter nodes by category
    const filteredNodes = activeCategoryFilter === 'ALL'
      ? graphData.nodes
      : graphData.nodes.filter(n => n.group === activeCategoryFilter);

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphData.edges.filter(
      e => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)
    );

    const visNodes = new DataSet<any>(
      filteredNodes.map(n => ({
        id: n.id,
        label: n.label,
        title: n.title,
        group: n.group,
        value: n.size || 20,
        color: n.color || {
          background: '#3b82f6',
          border: '#1d4ed8',
          highlight: { background: '#60a5fa', border: '#2563eb' }
        },
        font: { color: '#f8fafc', size: 12, face: 'Inter', multi: true },
        shape: 'dot',
      }))
    );

    const visEdges = new DataSet<any>(
      filteredEdges.map(e => ({
        id: e.id,
        from: e.from,
        to: e.to,
        label: e.label,
        title: e.title,
        arrows: 'to',
        color: { color: '#64748b', highlight: '#22c55e', hover: '#38bdf8' },
        font: { color: '#94a3b8', size: 10, align: 'middle', background: '#090d16' },
        smooth: { enabled: true, type: 'continuous', roundness: 0.5 }
      }))
    );

    const options: Options = {
      nodes: {
        borderWidth: 2,
        shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 2, y: 2 }
      },
      edges: {
        width: 1.5,
        selectionWidth: 3,
        hoverWidth: 2.5
      },
      physics: {
        enabled: isPhysicsEnabled,
        barnesHut: {
          gravitationalConstant: -3500,
          centralGravity: 0.35,
          springLength: 140,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.4
        },
        stabilization: { iterations: 150 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        navigationButtons: false,
        keyboard: false
      }
    };

    const network = new Network(containerRef.current, { nodes: visNodes, edges: visEdges }, options);
    networkRef.current = network;

    // Node click handler
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const nodeObj = graphData.nodes.find(n => n.id === nodeId) || null;
        setSelectedNode(nodeObj);
        setSelectedEdge(null);
      } else if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const edgeObj = graphData.edges.find(e => e.id === edgeId) || null;
        setSelectedEdge(edgeObj);
        setSelectedNode(null);
      } else {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    return () => {
      network.destroy();
    };
  }, [graphData, activeCategoryFilter]);

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.3 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 0.7 });
    }
  };

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
    }
  };

  const togglePhysics = () => {
    if (networkRef.current) {
      networkRef.current.setOptions({ physics: { enabled: !isPhysicsEnabled } });
      setIsPhysicsEnabled(!isPhysicsEnabled);
    }
  };

  return (
    <div className="relative w-full rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-2xl bg-slate-950/90">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800 bg-slate-900/60 gap-2">
        {/* Left: Category Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex-shrink-0">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                activeCategoryFilter === cat
                  ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right: Actions & Zoom Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFit}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={togglePhysics}
            className={`p-1.5 rounded-lg transition ${
              isPhysicsEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/80 text-slate-400'
            }`}
            title={isPhysicsEnabled ? 'Pause Physics' : 'Enable Physics'}
          >
            {isPhysicsEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          {showExport && onExportGraphML && (
            <button
              onClick={onExportGraphML}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition"
              title="Export GraphML for Gephi / Cytoscape"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export GraphML</span>
            </button>
          )}
        </div>
      </div>

      {/* Graph Canvas Container */}
      <div className="relative">
        <div ref={containerRef} style={{ height }} className="w-full bg-[#070b14]" />

        {/* Empty State overlay */}
        {graphData.nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-slate-400 p-6 text-center">
            <Info className="w-10 h-10 text-slate-500 mb-2" />
            <p className="font-semibold text-slate-200">No Knowledge Triples Extracted</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Analyze a news article or select a different entity category to generate and explore the knowledge graph.
            </p>
          </div>
        )}

        {/* Node Inspection Drawer / Modal */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 max-h-[90%] overflow-y-auto glass-panel border border-emerald-500/30 rounded-xl p-4 shadow-2xl z-20 animate-fadeIn">
            <div className="flex items-start justify-between pb-2 border-b border-slate-700/60">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {selectedNode.group}
                </span>
                <h4 className="text-base font-bold text-white mt-1">{selectedNode.label}</h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              {selectedNode.data?.connected_facts && selectedNode.data.connected_facts.length > 0 && (
                <div>
                  <h5 className="font-semibold text-slate-300 mb-1">Associated Extracted Facts:</h5>
                  <ul className="space-y-1">
                    {selectedNode.data.connected_facts.map((fact, idx) => (
                      <li key={idx} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-200 font-mono text-[11px]">
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edge Inspection Drawer */}
        {selectedEdge && (
          <div className="absolute top-4 right-4 w-80 max-h-[90%] overflow-y-auto glass-panel border border-amber-500/30 rounded-xl p-4 shadow-2xl z-20 animate-fadeIn">
            <div className="flex items-start justify-between pb-2 border-b border-slate-700/60">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  RELATIONSHIP
                </span>
                <h4 className="text-sm font-bold text-white mt-1">{selectedEdge.label}</h4>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px] font-medium uppercase">Triple:</div>
                <div className="text-emerald-300 font-semibold mt-0.5">
                  {selectedEdge.data?.subject} → <span className="text-amber-400">{selectedEdge.data?.predicate}</span> → {selectedEdge.data?.object}
                </div>
              </div>

              {selectedEdge.data?.evidence_sentence && (
                <div>
                  <h5 className="font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Grounding Evidence Sentence:</span>
                  </h5>
                  <p className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 italic text-[11px] leading-relaxed">
                    "{selectedEdge.data.evidence_sentence}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-sm">
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span>ORG</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span>PERSON</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span>LOCATION</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span>MONEY</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span><span>PRODUCT</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span><span>EVENT</span></div>
        </div>
      </div>

      {/* Graph Metrics Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
        <div>Nodes: <span className="text-white font-bold">{graphData.stats?.total_nodes || graphData.nodes.length}</span></div>
        <div>Edges: <span className="text-white font-bold">{graphData.stats?.total_edges || graphData.edges.length}</span></div>
        <div>Graph Density: <span className="text-emerald-400 font-bold">{graphData.stats?.density || 0}</span></div>
        <div>Engine: <span className="text-slate-300">NetworkX MultiDiGraph</span></div>
      </div>
    </div>
  );
};
