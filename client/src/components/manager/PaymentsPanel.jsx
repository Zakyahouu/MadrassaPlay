import React, { useEffect, useState } from 'react';
import axios from 'axios';
import formatDZ from '../../utils/currency';

const PaymentsPanel = ({ classId }) => {
  const [items, setItems] = useState([]);
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('pay_sessions');
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentId, setEnrollmentId] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPayments = async (eid) => {
    if (!eid) return setItems([]);
    const res = await axios.get('/api/payments', { params: { enrollmentId: eid } });
    setItems(res.data.items || []);
  };

  const loadEnrollments = async () => {
    if (!classId) return;
    try {
      const today = new Date().toISOString().slice(0,10);
      const res = await axios.get('/api/attendance/roster', { params: { classId, date: today } });
      const opts = (res.data.items || []).map(it => ({
        id: it.enrollmentId,
        label: `${it.student?.firstName || ''} ${it.student?.lastName || ''} (${it.student?.studentCode || ''})`.trim(),
      }));
      setEnrollments(opts);
      if (opts.length > 0) {
        setEnrollmentId(prev => prev || opts[0].id);
        await loadPayments(opts[0].id);
      } else {
        setEnrollmentId('');
        setItems([]);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load enrollments');
    }
  };

  useEffect(() => { loadEnrollments(); }, [classId]);
  useEffect(() => { loadPayments(enrollmentId); }, [enrollmentId]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('/api/payments', { enrollmentId, amount: parseInt(amount, 10), kind });
      setAmount('');
      await loadPayments(enrollmentId);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add payment');
    } finally { setLoading(false); }
  };

  if (!classId) return <div className="text-sm text-gray-500">Select a class.</div>;

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-600">Enrollment</label>
          <select className="border rounded px-2 py-1 w-full" value={enrollmentId} onChange={e=>setEnrollmentId(e.target.value)}>
            <option value="">Select enrollment</option>
            {enrollments.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Kind</label>
          <select className="border rounded px-2 py-1" value={kind} onChange={(e)=>setKind(e.target.value)}>
            <option value="pay_sessions">Pay Sessions</option>
            <option value="pay_cycles">Pay Cycles</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Amount</label>
          <input type="number" min="0" className="border rounded px-2 py-1" value={amount} onChange={(e)=>setAmount(e.target.value)} required />
        </div>
        <button disabled={loading || !enrollmentId} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{loading ? 'Saving…' : 'Add Payment'}</button>
      </form>
      <div className="bg-white border rounded">
        {items.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">No payments yet.</div>
        ) : (
          <ul className="divide-y">
            {items.map(p => (
              <li key={p._id} className="p-3 text-sm flex justify-between">
                <span>{new Date(p.createdAt).toLocaleString()} · {p.kind}</span>
                <span className="font-medium">{formatDZ(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PaymentsPanel;
