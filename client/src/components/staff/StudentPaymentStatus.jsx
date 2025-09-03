// StudentPaymentStatus.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudentPaymentStatus = ({ studentId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // Use unified API and normalized response shape { items }
        const response = await axios.get('/api/payments', { params: { studentId, limit: 100 } });
        setPayments(Array.isArray(response.data?.items) ? response.data.items : []);
      } catch (err) {
        setError('Failed to fetch payments.');
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchPayments();
  }, [studentId]);

  if (loading) return <div>Loading payment status...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h4 className="font-bold mb-2">Payments</h4>
      <ul className="space-y-1 text-sm">
        {payments.length > 0 ? (
          payments.map((p) => (
            <li key={p._id} className="flex items-center justify-between">
              <span>
                {new Date(p.createdAt).toLocaleDateString()} · {p.kind === 'pay_cycles' ? 'Cycles' : 'Sessions'}
              </span>
              <span className="font-medium">{Number(p.amount).toLocaleString()}</span>
            </li>
          ))
        ) : (
          <li>No payment records found.</li>
        )}
      </ul>
    </div>
  );
};

export default StudentPaymentStatus;
