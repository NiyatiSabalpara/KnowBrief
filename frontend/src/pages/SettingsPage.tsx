import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Server,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { NewsSource } from '../types';

export const SettingsPage: React.FC = () => {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [srcList, healthData] = await Promise.all([
        api.getSources(),
        api.checkHealth()
      ]);
      setSources(srcList);
      setHealth(healthData);
    } catch (e) {
      console.error('Failed to load settings data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Data Sources & Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor news source connectivity, publisher adapters, database health, and environment status.
        </p>
      </div>

      {/* Backend & Database Health Banner */}
      <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <Server className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">FastAPI Backend</div>
            <div className="text-xs font-bold text-white flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{health?.status === 'online' ? 'Online (v1.0.0)' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <Database className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">SQLite Persistence</div>
            <div className="text-xs font-bold text-white flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>knowledge_base.db</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <ShieldCheck className="w-6 h-6 text-purple-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">SSRF & Security</div>
            <div className="text-xs font-bold text-emerald-400 font-semibold mt-0.5">
              Protected
            </div>
          </div>
        </div>
      </div>

      {/* Publisher Adapters Table */}
      <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Configured News Publisher Adapters</h3>
            <p className="text-xs text-slate-400">Real RSS feed endpoints and web extraction policies</p>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Publisher</th>
                <th className="pb-3 font-semibold">Domain</th>
                <th className="pb-3 font-semibold">Access Policy</th>
                <th className="pb-3 font-semibold">Operational Status</th>
                <th className="pb-3 font-semibold text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sources.map((src) => (
                <tr key={src.code} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 font-bold text-white pr-4">{src.name}</td>
                  <td className="py-3 text-slate-300 pr-4 font-mono text-[11px]">{src.category}</td>
                  <td className="py-3 pr-4">
                    {src.requires_auth ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                        Paywall / Manual Paste
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                        Public RSS & Web
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{src.status}</span>
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <a
                      href={src.homepage_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded text-slate-400 hover:text-white inline-block"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
