import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const ResultDetail = () => {
  const { resultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`/api/results/detail/${resultId}`);
        if (!mounted) return;
        setData(data);
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load result.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [resultId]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const items = data?.items || [];
  const studentName = [data?.result?.student?.firstName, data?.result?.student?.lastName].filter(Boolean).join(' ') || data?.result?.student?.name || 'Student';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Result Detail</h1>
          <Link to={-1} className="text-indigo-600 hover:underline">Back</Link>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Student</div>
          <div>{studentName}</div>
          <div className="text-sm text-gray-500 mt-2">Score</div>
          <div>{data?.result?.score} / {data?.result?.totalPossibleScore}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 font-semibold border-b border-gray-100">Answers</div>
          <ol className="divide-y divide-gray-100">
            {items.map((it, i) => {
              const a = it.answer;
              const correct = !!a?.correct;
              return (
                <li key={i} className="p-4">
                  <div className="text-sm text-gray-500">Q{i+1}</div>
                  <div className="font-medium text-gray-900 mb-2">{it.question || '(Untitled question)'}</div>
                  {Array.isArray(it.options) && (
                    <ul className="ml-4 list-disc text-sm text-gray-700 mb-2">
                      {it.options.map((opt, idx) => (
                        <li key={idx} className={idx === it.correctIndex ? 'font-semibold text-emerald-700' : ''}>
                          {typeof opt === 'string' ? opt : (opt?.text || JSON.stringify(opt))}
                          {idx === it.correctIndex ? ' (correct)' : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className={correct ? 'text-emerald-700' : 'text-red-700'}>
                    Answer: {a?.selectedText ?? (Number.isFinite(a?.selectedIndex) ? `Option ${a.selectedIndex+1}` : '—')} • {correct ? 'Correct' : 'Wrong'}
                    {Number.isFinite(a?.timeMs) && (
                      <span className="text-gray-500"> • Time {(a.timeMs/1000).toFixed(1)}s</span>
                    )}
                  </div>
                </li>
              );
            })}
            {items.length === 0 && (
              <li className="p-4 text-gray-500">No question-level data.</li>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ResultDetail;
