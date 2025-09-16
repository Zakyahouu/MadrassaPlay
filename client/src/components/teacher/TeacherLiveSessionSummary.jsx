import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import LoadingState from '../shared/LoadingState';
import EmptyState from '../shared/EmptyState';
import { Copy as CopyIcon } from 'lucide-react';
import { useToast } from '../shared/ToastProvider';

const formatMs = (ms) => {
  if (!Number.isFinite(ms)) return '—';
  const s = Math.max(0, Math.round(ms / 100) / 10); // one decimal
  return `${s}s`;
};

export default function TeacherLiveSessionSummary() {
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [ranks, setRanks] = useState([]);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const headers = (() => { try { const t = JSON.parse(localStorage.getItem('user'))?.token; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; } })();
        const [sumRes, detRes] = await Promise.all([
          axios.get(`/api/live-sessions/${id}/summary`, { headers }),
          axios.get(`/api/live-sessions/${id}`, { headers })
        ]);
        if (!mounted) return;
        setSession(sumRes.data?.session || null);
        setRanks(Array.isArray(sumRes.data?.ranks) ? sumRes.data.ranks : []);
        setDetails(detRes.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load session summary');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const title = details?.gameCreation?.name || details?.title || 'Live Session';
  const code = session?.code || details?.code || '—';
  const status = session?.status || details?.status || '—';
  const startedAt = session?.startedAt ? new Date(session.startedAt).toLocaleString() : '—';
  const endedAt = session?.endedAt ? new Date(session.endedAt).toLocaleString() : (status === 'ended' ? '—' : null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <span>Code: <span className="font-mono select-all">{code}</span></span>
              {code && code !== '—' && (
                <button
                  type="button"
                  onClick={async()=>{ try{ await navigator.clipboard.writeText(code); toast('Code copied'); } catch{} }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  aria-label="Copy code"
                  title="Copy code"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
              )}
              <span>• Status: <span className="capitalize">{status}</span></span>
            </p>
          </div>
          <Link to="/teacher/dashboard?tab=live-sessions" className="px-3 py-2 text-sm rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Back to Live Sessions</Link>
        </div>

        {loading && <LoadingState message="Loading summary…" />}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <Link to="/teacher/dashboard?tab=live-sessions" className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Back</Link>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="text-gray-900">{startedAt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ended</p>
                <p className="text-gray-900">{endedAt || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p className="text-gray-900">{ranks.length}</p>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
            {ranks.length === 0 ? (
              <EmptyState title="No results recorded" message="This session has no recorded results yet." className="border-none" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Score</th>
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">Wrong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranks.map((r, i) => (
                      <tr key={`${r.studentId || r.userId || i}`} className="border-t border-gray-100">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">{[r.firstName, r.lastName].filter(Boolean).join(' ') || r.name || r.userId || '—'}</td>
                        <td className="px-3 py-2">{r.score ?? 0}</td>
                        <td className="px-3 py-2">{formatMs(r.effectiveTimeMs)}</td>
                        <td className="px-3 py-2">{r.wrong ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
