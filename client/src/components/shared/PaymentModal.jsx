import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

// Unified Payment Modal (default export)
// Props: isOpen, onClose, enrollmentId, pricingSnapshot, defaultKind, onSuccess
const PaymentModal = ({
  isOpen,
  onClose,
  enrollmentId = '',
  pricingSnapshot = {},
  defaultKind = 'pay_sessions',
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unit selection and quantity
  const initialUnitType = defaultKind === 'pay_cycles' ? 'cycle' : 'session';
  const [unitType, setUnitType] = useState(initialUnitType); // 'session' | 'cycle'
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const cyclePrice = Number(pricingSnapshot?.cyclePrice || 0);
  const cycleSize = Number(pricingSnapshot?.cycleSize || 4);
  // Rule: session price = cyclePrice / 4 (as requested)
  const sessionUnitPrice = cyclePrice > 0 ? cyclePrice / 4 : 0;
  const unitPrice = unitType === 'session' ? sessionUnitPrice : cyclePrice;
  const expectedPrice = useMemo(() => {
    const q = Number(quantity || 0);
    return Number.isFinite(q) && Number.isFinite(unitPrice) ? q * unitPrice : 0;
  }, [quantity, unitPrice]);

  // Taken (paid) amount is auto-filled from expectedPrice but editable
  const [taken, setTaken] = useState(String(expectedPrice || 0));
  useEffect(() => {
    setTaken(String(expectedPrice || 0));
  }, [expectedPrice, unitType]);

  const debt = useMemo(() => {
    const t = Number(taken || 0);
    return t - expectedPrice;
  }, [taken, expectedPrice]);

  const creditedUnits = useMemo(() => {
    const q = Number(quantity || 0);
    if (!q || q <= 0) return 0;
    return q; // sessions if unitType==='session', cycles if 'cycle'
  }, [quantity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enrollmentId) return;
    setIsSubmitting(true);
    try {
      const payload = {
        enrollmentId,
        // amount should reflect the expected price (unit price * quantity)
        amount: Number(expectedPrice || 0),
        method,
        note,
        kind: unitType === 'cycle' ? 'pay_cycles' : 'pay_sessions',
        // pass explicit fields for backend calculations
        unitType,
        units: Number(quantity || 0),
        expectedPrice: Number(expectedPrice || 0),
        taken: Number(taken || 0),
      };
      try {
        const tokenStr = localStorage.getItem('user');
        const token = tokenStr ? JSON.parse(tokenStr)?.token : null;
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        await axios.post('/api/payments', payload, config);
      } catch (postErr) {
        // Surface backend error
        const msg = postErr?.response?.data?.message || t.failedToRecordPayment || 'Failed to record payment';
        alert(msg);
        return;
      }
      await onSuccess?.({ ...payload, expectedPrice, debt, units: Number(quantity || 0) });
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{t.recordPayment}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t.unit}</label>
              <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className="w-full p-2 border rounded">
                <option value="session">{t.session}</option>
                <option value="cycle">{t.cycle}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.quantity}</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t.price}</label>
              <input value={expectedPrice.toFixed(2)} readOnly className="w-full p-2 border rounded bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.taken}</label>
              <input type="number" value={taken} onChange={(e) => setTaken(e.target.value)} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.debt}</label>
              <input value={debt.toFixed(2)} readOnly className="w-full p-2 border rounded bg-gray-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t.method}</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full p-2 border rounded">
                <option value="cash">{t.cash}</option>
                <option value="bank_transfer">{t.bankTransfer}</option>
                <option value="card">{t.card}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.note}</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-2 border rounded" placeholder={t.optional || "Optional"} />
            </div>
          </div>
          <div className="bg-gray-50 border rounded p-3 text-sm">
            <div>
              {t.credited}: <span className="font-medium">{creditedUnits}</span> {unitType === 'cycle' ? (t.cycles || 'cycle(s)') : (t.sessions || 'session(s)')}{unitType === 'cycle' && cycleSize ? ` (${cycleSize} ${t.sessionsPerCycle})` : ''}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 p-2 border rounded hover:bg-gray-50">{t.cancel}</button>
            <button type="submit" disabled={isSubmitting || Number(quantity) <= 0} className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? (t.processing || 'Processing...') : (t.save || 'Save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
