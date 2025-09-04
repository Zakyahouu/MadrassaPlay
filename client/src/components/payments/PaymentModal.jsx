import React, { useMemo, useState } from 'react';
import axios from 'axios';
import formatDZ from '../../utils/currency';

// Reusable payment modal used in Attendance roster and Enrollment checkout
// Props:
// - open: boolean
// - onClose: () => void
// - enrollmentId: string (required)
// - pricingSnapshot: { paymentModel, sessionPrice, cyclePrice, cycleSize } (optional but recommended)
// - initialKind: 'pay_sessions' | 'pay_cycles' (optional)
// - initialUnits: number (optional, default 1)
// - defaultNote: string (optional)
// - onSaved: () => void (optional)
export default function PaymentModal({ open, onClose, enrollmentId, pricingSnapshot, className: klassName, initialKind = 'pay_sessions', initialUnits = 1, defaultNote = '', onSaved }) {
  const [kind, setKind] = useState(initialKind);
  const [units, setUnits] = useState(initialUnits);
  const [note, setNote] = useState(defaultNote);
  const [saving, setSaving] = useState(false);

  const suggestedAmount = useMemo(() => {
    const u = Number(units || 1);
    if (!pricingSnapshot || isNaN(u)) return '';
    if (kind === 'pay_sessions') {
      if (typeof pricingSnapshot.sessionPrice === 'number' && pricingSnapshot.sessionPrice > 0) {
        return Math.round(u * pricingSnapshot.sessionPrice);
      }
      if (pricingSnapshot.cyclePrice > 0 && pricingSnapshot.cycleSize > 0) {
        const per = pricingSnapshot.cyclePrice / pricingSnapshot.cycleSize;
        return Math.round(u * per);
      }
    }
    if (kind === 'pay_cycles') {
      if (pricingSnapshot.cyclePrice > 0) return Math.round(u * pricingSnapshot.cyclePrice);
    }
    return '';
  }, [kind, units, pricingSnapshot]);

  const submit = async (e) => {
    e?.preventDefault?.();
    
    
    if (!enrollmentId) {
      
      return;
    }
    
    const amt = Number(suggestedAmount || 0);
    if (!amt || amt <= 0) {
      
      alert('Enter a valid amount');
      return;
    }
    
    try {
      setSaving(true);
  const idempotencyKey = (crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      const response = await axios.post('/api/payments', {
        enrollmentId,
        amount: Math.round(amt),
        kind,
        note: note?.trim() || undefined,
        idempotencyKey,
      });
      
      
      onClose?.();
      onSaved?.();
    } catch (err) {
      
      alert(err?.response?.data?.message || 'Failed to add payment');
    } finally {
      setSaving(false);
      
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-900">Add Payment</h4>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {klassName && (
          <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="text-sm text-gray-900 font-medium">{klassName}</div>
            {pricingSnapshot?.paymentModel === 'per_cycle' && typeof pricingSnapshot?.cyclePrice === 'number' && typeof pricingSnapshot?.cycleSize === 'number' && (
              <div className="text-xs text-gray-600 mt-1">Cycle: {pricingSnapshot.cycleSize} sessions · {formatDZ(pricingSnapshot.cyclePrice)}</div>
            )}
            {pricingSnapshot?.paymentModel === 'per_session' && typeof pricingSnapshot?.sessionPrice === 'number' && (
              <div className="text-xs text-gray-600 mt-1">Per session: {formatDZ(pricingSnapshot.sessionPrice)}</div>
            )}
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kind</label>
              <select className="w-full px-3 py-2 border rounded-md" value={kind} onChange={(e)=>setKind(e.target.value)}>
                <option value="pay_sessions">Pay Sessions</option>
                <option value="pay_cycles">Pay Cycles</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
              <input type="number" min="1" className="w-full px-3 py-2 border rounded-md" value={units} onChange={(e)=>setUnits(Math.max(1, parseInt(e.target.value||'1',10)))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (DZ)</label>
            <input type="number" min="0" className="w-full px-3 py-2 border rounded-md" value={suggestedAmount || ''} readOnly />
            {suggestedAmount ? (<p className="text-xs text-gray-500 mt-1">Suggested: {formatDZ(suggestedAmount)}</p>) : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input type="text" className="w-full px-3 py-2 border rounded-md" value={note} onChange={(e)=>setNote(e.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
