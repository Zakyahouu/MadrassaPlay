import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import formatDZ from '../../utils/currency';

const AttendanceRoster = ({ classId, date }) => {
	const [items, setItems] = useState([]); // summaries enriched
	const [paymentsIndex, setPaymentsIndex] = useState({}); // enrollmentId -> latest payment
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [savingPayment, setSavingPayment] = useState(false);
	const [paymentForm, setPaymentForm] = useState({ enrollmentId: '', kind: 'pay_sessions', units: 1, amount: '', note: '' });
	const [historyOpen, setHistoryOpen] = useState(false);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyItems, setHistoryItems] = useState([]);
	const [historyFor, setHistoryFor] = useState(null); // enrollmentId
	const [savingIds, setSavingIds] = useState(() => new Set()); // enrollmentIds currently saving
		// Removed local overrides; we rely on server as source of truth

	const fetchRoster = async () => {
		try {
			setLoading(true);
			// 1) Always load summaries (blocking)
			const sumRes = await axios.get(`/api/enrollments/class/${classId}/summaries`, { params: { date } });
			const summaries = sumRes.data?.items || [];
			setItems(summaries);
			// 2) Try to load payments (non-blocking). If it fails, keep roster visible.
			try {
				const payRes = await axios.get('/api/payments', { params: { class: classId, limit: 200 } });
				const list = payRes.data?.items || [];
				const idx = {};
				for (const p of list) {
					const eid = (p.enrollmentId?._id || p.enrollmentId || '').toString();
					if (eid && !idx[eid]) idx[eid] = p;
				}
				setPaymentsIndex(idx);
			} catch (payErr) {
				console.warn('Payments fetch failed (showing roster without last-payment chips):', payErr?.response?.data || payErr?.message);
				setPaymentsIndex({});
			}
		} catch (e) {
			setError(e.response?.data?.message || 'Failed to load roster');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (classId && date) fetchRoster();
	}, [classId, date]);

	// Removed interval pruning; no local overrides anymore

	const mark = async (enrollmentId, status) => {
		setSavingIds(prev => new Set(prev).add(enrollmentId));
		try {
			const res = await axios.post('/api/attendance/mark', { enrollmentId, date, status });
			// Use roster returned by server as source of truth
			const next = (res && res.data && Array.isArray(res.data.items)) ? res.data.items : items;
			setItems(next);
		} catch (e) {
			alert(e.response?.data?.message || 'Failed to mark');
		} finally {
			setSavingIds(prev => {
				const n = new Set(prev);
				n.delete(enrollmentId);
				return n;
			});
		}
	};

	const undo = async (enrollmentId) => {
		setSavingIds(prev => new Set(prev).add(enrollmentId));
		// Directly rely on server response
		try {
			const res = await axios.post('/api/attendance/undo', { enrollmentId, date });
			const next = (res && res.data && Array.isArray(res.data.items)) ? res.data.items : items;
			setItems(next);
		} catch (e) {
			alert(e.response?.data?.message || 'Failed to undo');
		} finally {
			setSavingIds(prev => {
				const n = new Set(prev);
				n.delete(enrollmentId);
				return n;
			});
		}
	};

	const openAddPayment = (enrollmentId, defaultKind = 'pay_sessions') => {
		setPaymentForm({ enrollmentId, kind: defaultKind, units: 1, amount: '', note: '' });
		setShowPaymentModal(true);
	};

	const currentSnap = useMemo(() => {
		if (!paymentForm.enrollmentId) return null;
		const it = items.find(x => (x.enrollmentId||'').toString() === (paymentForm.enrollmentId||'').toString());
		return it?.pricingSnapshot || null;
	}, [paymentForm.enrollmentId, items]);

	const suggestedAmount = useMemo(() => {
		const u = Number(paymentForm.units||1);
		if (!currentSnap || isNaN(u)) return '';
		if (paymentForm.kind === 'pay_sessions') {
			// Use explicit sessionPrice if provided, else derive per-session from cycle
			if (typeof currentSnap.sessionPrice === 'number' && currentSnap.sessionPrice > 0) {
				return Math.round(u * currentSnap.sessionPrice);
			}
			if (currentSnap.cyclePrice > 0 && currentSnap.cycleSize > 0) {
				const per = currentSnap.cyclePrice / currentSnap.cycleSize;
				return Math.round(u * per);
			}
		}
		if (paymentForm.kind === 'pay_cycles') {
			if (currentSnap.cyclePrice > 0) return Math.round(u * currentSnap.cyclePrice);
		}
		return '';
	}, [paymentForm.kind, paymentForm.units, currentSnap]);

	const openHistory = async (enrollmentId) => {
		try {
			setHistoryFor(enrollmentId);
			setHistoryOpen(true);
			setHistoryLoading(true);
			const res = await axios.get(`/api/attendance/history`, { params: { enrollmentId } });
			setHistoryItems(res.data?.items || []);
		} catch (e) {
			alert(e.response?.data?.message || 'Failed to load history');
		} finally {
			setHistoryLoading(false);
		}
	};

	const submitPayment = async (e) => {
		e?.preventDefault?.();
		if (!paymentForm.enrollmentId) return;
		const amt = Number(suggestedAmount || paymentForm.amount);
		if (!amt || amt <= 0) {
			alert('Enter a valid amount');
			return;
		}
		try {
			setSavingPayment(true);
			const idempotencyKey = (crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
			await axios.post('/api/payments', {
				enrollmentId: paymentForm.enrollmentId,
				amount: Math.round(amt),
				kind: paymentForm.kind,
				note: paymentForm.note?.trim() || undefined,
				idempotencyKey,
			});
			setShowPaymentModal(false);
			await fetchRoster();
		} catch (err) {
			alert(err?.response?.data?.message || 'Failed to add payment');
		} finally {
			setSavingPayment(false);
		}
	};

	if (!classId) return <div className="text-sm text-gray-500">Select a class to view roster.</div>;
	if (loading) return <div>Loading roster…</div>;
	if (error) return <div className="text-red-500">{error}</div>;

	return (
		<>
			<div className="space-y-2">
				{items.length === 0 && <div className="text-sm text-gray-500">No active enrollments.</div>}
				{items.map((it) => {
					const eid = (it.enrollmentId || '').toString();
					const remaining = Math.max(0, (it.sessionsCovered || 0) - (it.charged || 0));
					const overdue = (it.owedSessions || 0) > 0;
					const lastPay = paymentsIndex[eid];
					return (
						<div key={eid} className="flex items-center justify-between bg-white border rounded-lg p-3">
							<div>
								<div className="font-medium text-gray-900">{it.student?.firstName} {it.student?.lastName}</div>
								<div className="text-xs text-gray-500">{it.student?.studentCode}</div>
								<div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
									<span className={`px-2 py-0.5 rounded-full border ${remaining>0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Remaining prepaid: {remaining}</span>
									{overdue && <span className="px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">Overdue {it.owedSessions}</span>}
									{it.pricingSnapshot?.paymentModel === 'per_cycle' && (
										<span className="px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">Cycle: {it.pricingSnapshot.cycleSize} sessions · {formatDZ(it.pricingSnapshot.cyclePrice)}</span>
									)}
									{it.pricingSnapshot?.paymentModel === 'per_session' && typeof it.pricingSnapshot?.sessionPrice === 'number' && (
										<span className="px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">Per session: {formatDZ(it.pricingSnapshot.sessionPrice)}</span>
									)}
									{lastPay && (
										<span className="px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">Last: {formatDZ(lastPay.amount)} · {new Date(lastPay.createdAt).toLocaleDateString()}</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<span className={`text-xs px-2 py-1 rounded-full border ${it.todayStatus === 'present' ? 'bg-green-50 text-green-700 border-green-200' : it.todayStatus === 'absent' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
									{it.todayStatus || '—'}
								</span>
								<button disabled={savingIds.has(eid)} onClick={() => mark(eid, 'present')} className={`px-2 py-1 text-xs text-white rounded ${savingIds.has(eid) ? 'opacity-50 cursor-not-allowed bg-green-600' : 'bg-green-600 hover:bg-green-700'}`}>Present</button>
								<button disabled={savingIds.has(eid)} onClick={() => mark(eid, 'absent')} className={`px-2 py-1 text-xs text-white rounded ${savingIds.has(eid) ? 'opacity-50 cursor-not-allowed bg-red-600' : 'bg-red-600 hover:bg-red-700'}`}>Absent</button>
								<button disabled={savingIds.has(eid)} onClick={() => undo(eid)} className={`px-2 py-1 text-xs rounded ${savingIds.has(eid) ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-800' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Undo</button>
								<button onClick={() => openHistory(eid)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">History</button>
								<button onClick={() => openAddPayment(eid, remaining<=0 ? 'pay_cycles' : 'pay_sessions')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Add Payment</button>
							</div>
						</div>
					);
				})}
			</div>

			{showPaymentModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
					<div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
						<div className="flex items-center justify-between mb-3">
							<h4 className="text-lg font-semibold text-gray-900">Add Payment</h4>
							<button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
						</div>
						<form onSubmit={submitPayment} className="space-y-3">
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Kind</label>
									<select className="w-full px-3 py-2 border rounded-md" value={paymentForm.kind} onChange={(e)=>setPaymentForm(f=>({...f, kind: e.target.value}))}>
										<option value="pay_sessions">Pay Sessions</option>
										<option value="pay_cycles">Pay Cycles</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
									<input type="number" min="1" className="w-full px-3 py-2 border rounded-md" value={paymentForm.units} onChange={(e)=>setPaymentForm(f=>({...f, units: Math.max(1, parseInt(e.target.value||'1',10))}))} />
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Amount (DZ)</label>
									<input type="number" min="0" className="w-full px-3 py-2 border rounded-md" value={suggestedAmount || ''} readOnly />
								{suggestedAmount ? (<p className="text-xs text-gray-500 mt-1">Suggested: {formatDZ(suggestedAmount)}</p>) : null}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
								<input type="text" className="w-full px-3 py-2 border rounded-md" value={paymentForm.note} onChange={(e)=>setPaymentForm(f=>({...f, note: e.target.value}))} />
							</div>
							<div className="flex items-center justify-end gap-2 pt-2">
								<button type="button" onClick={()=>setShowPaymentModal(false)} className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
								<button type="submit" disabled={savingPayment} className="px-3 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{savingPayment ? 'Saving…' : 'Save Payment'}</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
};

export default AttendanceRoster;

