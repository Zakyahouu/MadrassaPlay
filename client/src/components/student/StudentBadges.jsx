import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Award, Lock } from 'lucide-react';

/* StudentBadges
 * Shows all template badges (earned + not yet earned) in a grid.
 * - Fetches active template badges
 * - Fetches earned badges with progress (/api/template-badges/me/list)
 * - Merges data so locked badges appear dimmed
 * - Click a badge opens a modal with tier ladder & progress info
 */

const tierColors = [
  'from-indigo-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-sky-500 to-cyan-500'
];

export default function StudentBadges() {
  const [allBadges, setAllBadges] = useState([]);
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | earned | locked
  const [selected, setSelected] = useState(null); // merged badge object for modal
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [allRes, earnedRes] = await Promise.all([
          axios.get('/api/template-badges'),
          axios.get('/api/template-badges/me/list')
        ]);
        if (!mounted) return;
        setAllBadges(allRes.data || []);
        setEarned(earnedRes.data || []);
      } catch (e) {
        if (mounted) {
          setAllBadges([]); setEarned([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const refreshHandler = () => { setLoading(true); load(); };
    window.addEventListener('templateBadgesRefresh', refreshHandler);
    return () => { mounted = false; window.removeEventListener('templateBadgesRefresh', refreshHandler); };
  }, []);

  const merged = useMemo(() => {
    if (!allBadges.length) return [];
    return allBadges.map(tb => {
      const earnedMatch = earned.find(e => e.templateBadge && (e.templateBadge._id === tb._id));
      let currentVariantLabel = null;
      let percentage = null;
      let progress = null;
      if (earnedMatch) {
        currentVariantLabel = earnedMatch.variantLabel;
        percentage = earnedMatch.progress?.percentage ?? earnedMatch.percentage;
        progress = earnedMatch.progress;
      }
      // Determine next variant if not earned
      if (!progress) {
        // Not earned; next variant is the lowest tier (last in variants sorted desc highest->lowest; backend sorts desc)
        const ordered = tb.variants || [];
        const lowest = ordered[ordered.length - 1];
        progress = {
          percentage: 0,
          currentThreshold: null,
          nextVariant: lowest ? { label: lowest.label, thresholdPercent: lowest.thresholdPercent, iconUrl: lowest.iconUrl } : null,
          neededForNext: lowest ? lowest.thresholdPercent : null
        };
      }
      return {
        ...tb,
        earned: !!earnedMatch,
        currentVariantLabel,
        percentage,
        progress
      };
    });
  }, [allBadges, earned]);

  const filtered = merged.filter(b => {
    if (filter === 'earned') return b.earned;
    if (filter === 'locked') return !b.earned;
    return true;
  });

  const openModal = (badge) => { setSelected(badge); setModalOpen(true); };

  if (loading) return <div className="text-sm text-gray-500">Loading badges…</div>;
  if (!merged.length) return <div className="text-sm text-gray-500">No badges available yet.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2"><Award className="w-5 h-5 text-indigo-600" /> My Badges</h4>
          <span className="text-xs text-gray-500">Earned {merged.filter(b=>b.earned).length}/{merged.length}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {['all','earned','locked'].map(f => (
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-full border transition ${filter===f ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-300'}`}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((b, idx) => {
          const topVariant = b.variants?.[0];
          const currentVariant = b.variants?.find(v => v.label === b.currentVariantLabel);
          const nextVariant = b.progress?.nextVariant;
          const color = tierColors[idx % tierColors.length];
          return (
            <div key={b._id} onClick={()=>openModal(b)} className={`relative group p-5 rounded-2xl border cursor-pointer transition overflow-hidden ${b.earned ? 'bg-white hover:shadow-md border-indigo-200' : 'bg-gray-50 hover:shadow-sm border-gray-200'} `}>
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br ${color} mix-blend-multiply pointer-events-none rounded-2xl`}></div>
              <div className="relative z-10 flex items-start gap-4">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-br ${color} text-white shadow-md ring-2 ring-indigo-200/70 transition-transform duration-200 group-hover:scale-[1.03] ${!b.earned ? 'grayscale opacity-60' : ''}`}>
                  {currentVariant?.iconUrl ? <img src={currentVariant.iconUrl} alt={currentVariant.label} className="w-24 h-24 object-contain drop-shadow-sm" /> : <Award className="w-10 h-10" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-base truncate ${b.earned ? 'text-gray-900' : 'text-gray-600'}`}>{b.name}</p>
                  <p className="text-sm text-indigo-600 font-medium truncate">{b.currentVariantLabel || 'Locked'}</p>
                  {b.earned ? (
                    <div className="mt-1 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.min(100, b.progress?.percentage || 0)}%` }}></div>
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-gray-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Earn ≥{b.progress?.nextVariant?.thresholdPercent}%</div>
                  )}
                  {b.earned && nextVariant && (
                    <p className="mt-1 text-xs text-gray-500">Need {b.progress.neededForNext} pts for {nextVariant.label}</p>
                  )}
                  {b.earned && !nextVariant && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium">Top tier achieved</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative animate-fadeIn border">
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{selected.description || 'Badge details & tiers'}</p>
              </div>
              <button onClick={()=>setModalOpen(false)} className="p-2 text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
            </div>
            <div className="p-5 space-y-6">
              <div className="flex flex-wrap gap-4">
                {selected.variants?.map((v,i) => {
                  const earnedTier = v.label === selected.currentVariantLabel;
                  const passed = selected.percentage != null && selected.percentage >= v.thresholdPercent;
                  const locked = !passed;
                  return (
                    <div key={v.label} className={`relative flex-1 min-w-[180px] p-6 rounded-xl border text-center ${earnedTier ? 'border-indigo-300 bg-indigo-50' : locked ? 'border-gray-200 bg-gray-50' : 'border-emerald-300 bg-emerald-50'} transition`}> 
                      <div className="mb-4 flex justify-center">
                        {v.iconUrl 
                          ? <img src={v.iconUrl} alt={v.label} className={`h-24 w-24 object-contain rounded-full ring-2 ring-indigo-200/70 shadow ${locked && !earnedTier ? 'grayscale opacity-60' : ''}`} /> 
                          : <Award className={`w-12 h-12 ${(locked && !earnedTier) ? 'text-gray-400' : 'text-indigo-600'}`} />}
                      </div>
                      <p className={`font-semibold text-base ${earnedTier ? 'text-indigo-700' : 'text-gray-700'}`}>{v.label}</p>
                      <p className="text-xs text-gray-500 mb-2">≥{v.thresholdPercent}%</p>
                      {earnedTier && <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white">Current</span>}
                      {!earnedTier && !locked && <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">Achieved</span>}
                      {locked && !earnedTier && <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gray-300 text-gray-700">Locked</span>}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500">
                Evaluation Mode: <span className="font-medium text-gray-700 capitalize">{selected.evaluationMode === 'firstAttempt' ? 'First Attempt' : 'Highest Attempt'}</span>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={()=>setModalOpen(false)} className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
