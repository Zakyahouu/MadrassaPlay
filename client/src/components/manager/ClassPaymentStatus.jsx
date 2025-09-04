// ClassPaymentStatus.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import formatDZ from '../../utils/currency';

const ClassPaymentStatus = ({ classId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await axios.get(`/api/payments?class=${classId}`);
        setPayments(response.data.items || []);
      } catch (err) {
        setError('Failed to fetch payments.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [classId]);

  if (loading) return <div>Loading payment status...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h4 className="font-bold mb-2">Class Payment Status</h4>
      <ul>
        {payments.length > 0 ? (
          payments.map(payment => (
            <li key={payment._id}>
              Student: {payment.studentId?.firstName} {payment.studentId?.lastName} | Kind: {payment.kind} | Amount: {formatDZ(payment.amount)}
            </li>
          ))
        ) : (
          <li>No payment records found.</li>
        )}
      </ul>
    </div>
  );
};

export default ClassPaymentStatus;
