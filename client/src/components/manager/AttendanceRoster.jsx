import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import formatDZ from '../../utils/currency';
import PaymentModal from '../shared/PaymentModal';

const AttendanceRoster = ({ classId, date }) => {
	const [items, setItems] = useState([]); // summaries enriched
	const [paymentsIndex, setPaymentsIndex] = useState({}); // enrollmentId -> latest payment
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [selectedEnrollment, setSelectedEnrollment] = useState(null);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyItems, setHistoryItems] = useState([]);
	const [historyFor, setHistoryFor] = useState(null); // enrollmentId
	const [savingIds, setSavingIds] = useState(() => new Set()); // enrollmentIds currently saving
	const [recentActions, setRecentActions] = useState(() => new Map()); // enrollmentId -> { action, timestamp }
		// Removed local overrides; we rely on server as source of truth

	// Helper function to check if we should show "Not Marked Yet" for new days
	const shouldShowNotMarkedYet = (todayStatus, currentDate) => {
		// Always show "Not Marked Yet" if no status is recorded for today
		// This automatically handles the midnight reset - when you check the next day,
		// there will be no attendance record for that date, so it shows "Not Marked Yet"
		return !todayStatus;
	};

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
			
			// Record the action for visual feedback
			setRecentActions(prev => {
				const newMap = new Map(prev);
				newMap.set(enrollmentId, { 
					action: `Marked as ${status}`, 
					timestamp: Date.now() 
				});
				return newMap;
			});
			
			// Clear the action after 3 seconds
			setTimeout(() => {
				setRecentActions(prev => {
					const newMap = new Map(prev);
					newMap.delete(enrollmentId);
					return newMap;
				});
			}, 3000);
			
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
			
			// Record the action for visual feedback
			setRecentActions(prev => {
				const newMap = new Map(prev);
				newMap.set(enrollmentId, { 
					action: 'Undo completed', 
					timestamp: Date.now() 
				});
				return newMap;
			});
			
			// Clear the action after 3 seconds
			setTimeout(() => {
				setRecentActions(prev => {
					const newMap = new Map(prev);
					newMap.delete(enrollmentId);
					return newMap;
				});
			}, 3000);
			
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

	const openAddPayment = (enrollmentId) => {
		const it = items.find(x => (x.enrollmentId||'').toString() === (enrollmentId||'').toString());
		setSelectedEnrollment({ _id: enrollmentId, pricingSnapshot: it?.pricingSnapshot, balance: it?.balance ?? 0 });
		setShowPaymentModal(true);
	};

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

	if (!classId) return (
		<div className="flex flex-col items-center justify-center py-12 px-4">
			<div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
				<svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			</div>
			<p className="text-gray-600 text-center font-medium">Select a class to view attendance roster</p>
			<p className="text-gray-400 text-sm text-center mt-2">Choose a class from the sidebar to get started</p>
		</div>
	);

	if (loading) return (
		<div className="flex flex-col items-center justify-center py-12 px-4">
			<div className="relative">
				<div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
			</div>
			<p className="text-gray-600 font-medium mt-4">Loading attendance roster...</p>
			<p className="text-gray-400 text-sm mt-1">Please wait while we fetch the data</p>
		</div>
	);

	if (error) return (
		<div className="flex flex-col items-center justify-center py-12 px-4">
			<div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4">
				<svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<p className="text-red-600 font-medium text-center">{error}</p>
			<button 
				onClick={fetchRoster}
				className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
			>
				Try Again
			</button>
		</div>
	);

	return (
		<>
			<div className="space-y-4">
				{items.length === 0 && (
					<div className="flex flex-col items-center justify-center py-16 px-4">
						<div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
							<svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Enrollments</h3>
						<p className="text-gray-500 text-center">There are currently no students enrolled in this class.</p>
					</div>
				)}

				{items.map((it) => {
					const eid = (it.enrollmentId || '').toString();
					const remainingDerived = Math.max(0, (it.sessionsCovered || 0) - (it.charged || 0));
					const balance = typeof it.balance === 'number' ? it.balance : remainingDerived;
					const overdue = balance < 0 || (it.owedSessions || 0) > 0;
					const lastPay = paymentsIndex[eid];
					const isSaving = savingIds.has(eid);
					const recentAction = recentActions.get(eid);

					return (
						<div 
							key={eid} 
							className={`group relative bg-white border border-gray-200 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-lg ${isSaving ? 'opacity-75' : ''}`}
							onClick={(ev) => {
								window.dispatchEvent(new CustomEvent('attendance:openStudentPopup', { detail: { student: it.student, enrollmentId: eid } }));
							}}
						>
							{/* Saving overlay */}
							{isSaving && (
								<div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center z-10">
									<div className="flex items-center space-x-2">
										<div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
										<span className="text-sm text-blue-600 font-medium">Saving...</span>
									</div>
								</div>
							)}

							<div className="flex items-start justify-between">
								{/* Student Info */}
								<div className="flex-1">
									<div className="flex items-center space-x-3 mb-3">
										<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
											{it.student?.firstName?.charAt(0)}{it.student?.lastName?.charAt(0)}
										</div>
										<div>
											<h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
												{it.student?.firstName} {it.student?.lastName}
											</h3>
											<p className="text-gray-500 text-sm font-medium">{it.student?.studentCode}</p>
										</div>
									</div>

									{/* Status Badges */}
									<div className="flex items-center gap-2 mb-4 overflow-x-auto">
										{/* Balance Badge */}
										<div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border-2 whitespace-nowrap ${
											balance > 0 
												? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
												: balance === 0 
													? 'bg-gray-50 text-gray-600 border-gray-200' 
													: 'bg-red-50 text-red-700 border-red-200'
										}`}>
											<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
											</svg>
											Balance: {balance.toFixed ? balance.toFixed(2) : balance}
										</div>

										{/* Overdue Badge */}
										{overdue && (
											<div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border-2 bg-orange-50 text-orange-700 border-orange-200 whitespace-nowrap">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												Overdue {it.owedSessions}
											</div>
										)}

										{/* Pricing Model Badge */}
										{it.pricingSnapshot?.paymentModel === 'per_cycle' && (
											<div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border-2 bg-indigo-50 text-indigo-700 border-indigo-200 whitespace-nowrap">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
												Cycle: {it.pricingSnapshot.cycleSize} sessions · {formatDZ(it.pricingSnapshot.cyclePrice)}
											</div>
										)}

										{it.pricingSnapshot?.paymentModel === 'per_session' && typeof it.pricingSnapshot?.sessionPrice === 'number' && (
											<div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border-2 bg-purple-50 text-purple-700 border-purple-200 whitespace-nowrap">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
												</svg>
												Per session: {formatDZ(it.pricingSnapshot.sessionPrice)}
											</div>
										)}

										{/* Last Payment Badge */}
										{lastPay && (
											<div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border-2 bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
												</svg>
												Last: {formatDZ(lastPay.amount)} · {new Date(lastPay.createdAt).toLocaleDateString()}
											</div>
										)}
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex items-center space-x-3 ml-6">
									{/* Status Display */}
									<div className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
										recentAction
											? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
											: shouldShowNotMarkedYet(it.todayStatus, date)
												? 'bg-gray-50 text-gray-600 border-gray-200'
												: (it.todayStatus === 'present' 
													? 'bg-green-50 text-green-700 border-green-200' 
													: 'bg-red-50 text-red-700 border-red-200')
									}`}>
										{recentAction 
											? recentAction.action 
											: shouldShowNotMarkedYet(it.todayStatus, date)
												? 'Not Marked Yet'
												: it.todayStatus
										}
									</div>

									{/* Attendance Buttons */}
									<div className="flex items-center space-x-2">
										<button 
											disabled={isSaving} 
											onClick={(e) => { e.stopPropagation(); mark(eid, 'present'); }} 
											className={`inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 ${
												isSaving 
													? 'opacity-50 cursor-not-allowed bg-green-600' 
													: 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95'
											}`}
										>
											<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
											Present
										</button>
										<button 
											disabled={isSaving} 
											onClick={(e) => { e.stopPropagation(); mark(eid, 'absent'); }} 
											className={`inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 ${
												isSaving 
													? 'opacity-50 cursor-not-allowed bg-red-600' 
													: 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95'
											}`}
										>
											<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
											Absent
										</button>
									</div>

									{/* Payment Button */}
									<button 
										onClick={(e) => { e.stopPropagation(); openAddPayment(eid); }} 
										className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-all duration-200 hover:scale-105 active:scale-95"
									>
										<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
										</svg>
										Payment
									</button>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{showPaymentModal && (
				<PaymentModal
					isOpen={showPaymentModal}
					onClose={() => setShowPaymentModal(false)}
					enrollmentId={selectedEnrollment?._id || ''}
					pricingSnapshot={selectedEnrollment?.pricingSnapshot}
					defaultKind={(selectedEnrollment?.balance ?? 0) <= 0 ? 'pay_cycles' : 'pay_sessions'}
					onSuccess={async () => { await fetchRoster(); }}
				/>
			)}
		</>
	);
};

export default AttendanceRoster;