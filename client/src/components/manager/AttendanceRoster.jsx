import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import formatDZ from '../../utils/currency';
import PaymentModal from '../shared/PaymentModal';
import { useLanguage } from '../../context/LanguageContext';

const AttendanceRoster = ({ classId, date }) => {
	const { t } = useLanguage();
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
	const [notesByEnrollment, setNotesByEnrollment] = useState({});
	const [noteOpenByEnrollment, setNoteOpenByEnrollment] = useState({});
	const [bulkMarking, setBulkMarking] = useState(false);
	const [showUnmarkedOnly, setShowUnmarkedOnly] = useState(false);
	const [savingIds, setSavingIds] = useState(() => new Set()); // enrollmentIds currently saving
	const [recentActions, setRecentActions] = useState(() => new Map()); // enrollmentId -> { action, timestamp }

	// Helper function to check if we should show "Not Marked Yet" for new days
	const shouldShowNotMarkedYet = (todayStatus, currentDate) => {
		return !todayStatus;
	};

	const fetchRoster = async () => {
		try {
			setLoading(true);
			const sumRes = await axios.get(`/api/enrollments/class/${classId}/summaries`, { params: { date } });
			const summaries = sumRes.data?.items || [];
			setItems(summaries);
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
				console.warn('Payments fetch failed:', payErr?.response?.data || payErr?.message);
				setPaymentsIndex({});
			}
		} catch (e) {
			setError(e.response?.data?.message || t.failedLoadRoster);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (classId && date) fetchRoster();
	}, [classId, date]);

	const attendanceCounts = useMemo(() => {
		const counts = { present: 0, absent: 0, unmarked: 0 };
		for (const it of items) {
			if (it.todayStatus === 'present') counts.present += 1;
			else if (it.todayStatus === 'absent') counts.absent += 1;
			else counts.unmarked += 1;
		}
		return counts;
	}, [items]);

	const unmarkedCount = attendanceCounts.unmarked;

	const displayItems = useMemo(() => {
		if (!showUnmarkedOnly) return items;
		return items.filter((it) => !it.todayStatus);
	}, [items, showUnmarkedOnly]);

	const mark = async (enrollmentId, status) => {
		setSavingIds(prev => new Set(prev).add(enrollmentId));
		try {
			const noteValue = (notesByEnrollment[enrollmentId] || '').trim();
			const payload = { enrollmentId, date, status };
			if (noteValue) payload.note = noteValue;
			const res = await axios.post('/api/attendance/mark', payload);
			const next = (res && res.data && Array.isArray(res.data.items)) ? res.data.items : items;
			setItems(next);
			if (noteValue) {
				setNotesByEnrollment(prev => {
					if (!prev[enrollmentId]) return prev;
					const nextNotes = { ...prev };
					delete nextNotes[enrollmentId];
					return nextNotes;
				});
			}

			setRecentActions(prev => {
				const newMap = new Map(prev);
				newMap.set(enrollmentId, {
					action: `${t.markedAs} ${t[status] || status}`,
					timestamp: Date.now()
				});
				return newMap;
			});

			setTimeout(() => {
				setRecentActions(prev => {
					const newMap = new Map(prev);
					newMap.delete(enrollmentId);
					return newMap;
				});
			}, 3000);

		} catch (e) {
			alert(e.response?.data?.message || t.failedToMark);
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
		try {
			const res = await axios.post('/api/attendance/undo', { enrollmentId, date });
			const next = (res && res.data && Array.isArray(res.data.items)) ? res.data.items : items;
			setItems(next);

			setRecentActions(prev => {
				const newMap = new Map(prev);
				newMap.set(enrollmentId, {
					action: t.undoCompleted,
					timestamp: Date.now()
				});
				return newMap;
			});

			setTimeout(() => {
				setRecentActions(prev => {
					const newMap = new Map(prev);
					newMap.delete(enrollmentId);
					return newMap;
				});
			}, 3000);

		} catch (e) {
			alert(e.response?.data?.message || t.failedToUndo);
		} finally {
			setSavingIds(prev => {
				const n = new Set(prev);
				n.delete(enrollmentId);
				return n;
			});
		}
	};

	const markAllPresent = async () => {
		if (bulkMarking || unmarkedCount === 0) return;
		const message = (t.confirmMarkAllPresent || 'Mark all unmarked students as present?')
			.replace('{count}', String(unmarkedCount));
		if (!window.confirm(message)) return;
		const targets = items
			.filter((it) => !it.todayStatus)
			.map((it) => (it.enrollmentId || '').toString())
			.filter(Boolean);
		if (!targets.length) return;
		setBulkMarking(true);
		try {
			await Promise.allSettled(
				targets.map((enrollmentId) =>
					axios.post('/api/attendance/mark', { enrollmentId, date, status: 'present' })
				)
			);
			await fetchRoster();
		} catch (e) {
			alert(e?.response?.data?.message || t.failedToMark);
		} finally {
			setBulkMarking(false);
		}
	};

	const openAddPayment = (enrollmentId) => {
		const it = items.find(x => (x.enrollmentId || '').toString() === (enrollmentId || '').toString());
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
			alert(e.response?.data?.message || t.failedToLoadHistory);
		} finally {
			setHistoryLoading(false);
		}
	};

	if (!classId) return (
		<div className="flex flex-col items-center justify-center py-12 px-4">
			<div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
				<svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			</div>
			<p className="text-gray-700 text-center font-medium">{t.selectClassToViewRoster}</p>
			<p className="text-gray-500 text-sm text-center mt-2">{t.chooseClassSidebar}</p>
		</div>
	);

	if (loading) return (
		<div className="flex flex-col items-center justify-center py-12 px-4">
			<div className="relative">
				<div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
			</div>
			<p className="text-gray-700 font-medium mt-4">{t.loadingAttendanceRoster}</p>
			<p className="text-gray-500 text-sm mt-1">{t.waitWhileFetchData}</p>
		</div>
	);

	if (error) return (
		<div className="flex flex-col items-center justify-center py-12 px-4">
			<div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
				<svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<p className="text-red-600 font-medium text-center">{error}</p>
			<button
				onClick={fetchRoster}
				className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium text-sm"
			>
				{t.tryAgain}
			</button>
		</div>
	);

	return (
		<>
			<div className="space-y-4">
				{items.length > 0 && (
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex flex-wrap items-center gap-3">
							<button
								type="button"
								onClick={markAllPresent}
								disabled={bulkMarking || unmarkedCount === 0}
								className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${bulkMarking || unmarkedCount === 0
									? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
									: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
									}`}
							>
								{bulkMarking ? t.processing : t.markAllPresent}
							</button>
							<label className="flex items-center gap-2 text-sm text-gray-600">
								<input
									type="checkbox"
									className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
									checked={showUnmarkedOnly}
									onChange={(e) => setShowUnmarkedOnly(e.target.checked)}
								/>
								{t.showUnmarkedOnly}
							</label>
						</div>
						<div className="text-xs text-gray-500">
							{t.present}: {attendanceCounts.present} • {t.absent}: {attendanceCounts.absent} • {t.notMarked}: {attendanceCounts.unmarked}
						</div>
					</div>
				)}

				{items.length === 0 && (
					<div className="flex flex-col items-center justify-center py-16 px-4">
						<div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
							<svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-700 mb-2">{t.noActiveEnrollments}</h3>
						<p className="text-gray-500 text-center">{t.noStudentsEnrolledInClass}</p>
					</div>
				)}

				{displayItems.map((it) => {
					const eid = (it.enrollmentId || '').toString();
					const balance = typeof it.balance === 'number' ? it.balance : 0;
					const overdue = balance < 0 || (it.owedSessions || 0) > 0;
					const lastPay = paymentsIndex[eid];
					const isSaving = savingIds.has(eid);
					const recentAction = recentActions.get(eid);
					const isNoteOpen = !!noteOpenByEnrollment[eid];

					return (
						<div
							key={eid}
							className={`group relative card-base p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${isSaving ? 'opacity-75' : ''}`}
							onClick={(ev) => {
								window.dispatchEvent(new CustomEvent('attendance:openStudentPopup', { detail: { student: it.student, enrollmentId: eid } }));
							}}
						>
							{isSaving && (
								<div className="absolute inset-0 bg-white/75 rounded-xl flex items-center justify-center z-10">
									<div className="flex items-center space-x-2">
										<div className="w-4 h-4 border-2 border-border-light border-t-primary rounded-full animate-spin"></div>
										<span className="text-sm text-primary font-medium">{t.saving}</span>
									</div>
								</div>
							)}

							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center space-x-3 mb-3">
										<div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-medium text-lg shadow-sm">
											{it.student?.firstName?.charAt(0)}{it.student?.lastName?.charAt(0)}
										</div>
										<div>
											<h3 className="font-semibold text-text-main-light text-lg">
												{it.student?.firstName} {it.student?.lastName}
											</h3>
											<p className="text-text-muted-light text-sm">{it.student?.studentCode}</p>
										</div>
									</div>

									<div className="flex items-center gap-2 mb-4 overflow-x-auto">
										<div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${balance > 0
											? 'bg-green-50 text-green-700 border border-green-200'
											: balance === 0
												? 'bg-gray-50 text-gray-600 border border-gray-200'
												: 'bg-red-50 text-red-700 border border-red-200'
											}`}>
											<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
											</svg>
											{t.balanceLabel}: {balance.toFixed ? balance.toFixed(2) : balance}
										</div>

										{overdue && (
											<div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												{t.overdueLabel} {it.owedSessions}
											</div>
										)}

										{it.pricingSnapshot?.paymentModel === 'per_cycle' && (
											<div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
												{t.cycleLabel}: {it.pricingSnapshot.cycleSize} {t.sessions} · {formatDZ(it.pricingSnapshot.cyclePrice)}
											</div>
										)}

										{it.pricingSnapshot?.paymentModel === 'per_session' && typeof it.pricingSnapshot?.sessionPrice === 'number' && (
											<div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
												</svg>
												{t.perSessionLabel}: {formatDZ(it.pricingSnapshot.sessionPrice)}
											</div>
										)}

										{lastPay && (
											<div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
												</svg>
												{t.lastLabel}: {formatDZ(lastPay.amount)} · {new Date(lastPay.createdAt).toLocaleDateString()}
											</div>
										)}
									</div>
								</div>

								<div className="flex items-center space-x-3 ml-6">
									<div className={`w-32 text-center px-4 py-2 rounded-md text-sm font-medium ${recentAction
										? 'bg-blue-50 text-blue-700 animate-pulse'
										: shouldShowNotMarkedYet(it.todayStatus, date)
											? 'bg-gray-50 text-gray-600'
											: (it.todayStatus === 'present'
												? 'bg-green-50 text-green-700'
												: 'bg-red-50 text-red-700')
										}`}>
										{recentAction
											? recentAction.action
											: shouldShowNotMarkedYet(it.todayStatus, date)
												? t.notMarked
												: t[it.todayStatus] || it.todayStatus
										}
									</div>

									<div className="flex items-center space-x-2">
										<button
											disabled={isSaving}
											onClick={(e) => { e.stopPropagation(); mark(eid, 'present'); }}
											className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md transition-all duration-200 ${isSaving
												? 'opacity-50 cursor-not-allowed bg-green-600'
												: 'bg-green-600 hover:bg-green-700'
												}`}
										>
											<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
											{t.present}
										</button>
										<button
											disabled={isSaving}
											onClick={(e) => { e.stopPropagation(); mark(eid, 'absent'); }}
											className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md transition-all duration-200 ${isSaving
												? 'opacity-50 cursor-not-allowed bg-red-600'
												: 'bg-red-600 hover:bg-red-700'
												}`}
										>
											<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
											{t.absent}
										</button>
										<button
											type="button"
											disabled={isSaving}
											onClick={(e) => {
												e.stopPropagation();
												setNoteOpenByEnrollment(prev => ({ ...prev, [eid]: !prev[eid] }));
											}}
											title={t.note}
											className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${isNoteOpen
												? 'border-primary text-primary bg-primary/5'
												: 'border-gray-200 text-gray-600 hover:bg-gray-50'
											}`}
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l4 4v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3v5h5" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6" />
											</svg>
											{t.note}
										</button>
									</div>

									<button
										onClick={(e) => { e.stopPropagation(); openAddPayment(eid); }}
										className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all duration-200"
									>
										<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
										</svg>{t.payment}</button>
								</div>
							</div>

							{isNoteOpen && (
								<div className="mt-4" onClick={(e) => e.stopPropagation()}>
									<label className="block text-xs font-medium text-gray-500 mb-1">
										{t.noteOptional || t.note}
									</label>
									<input
										type="text"
										value={notesByEnrollment[eid] || ''}
										onChange={(e) => setNotesByEnrollment(prev => ({ ...prev, [eid]: e.target.value }))}
										placeholder={t.noteOptional || t.note}
										maxLength={500}
										className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
										onClick={(e) => e.stopPropagation()}
										onFocus={(e) => e.stopPropagation()}
									/>
								</div>
							)}
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