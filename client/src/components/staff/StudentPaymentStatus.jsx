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
        const response = await axios.get(`/api/payments?student=${studentId}`);
        setPayments(response.data);
      } catch (err) {
        setError('Failed to fetch payments.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [studentId]);

  if (loading) return <div>Loading payment status...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h4 className="font-bold mb-2">Payment Status</h4>
      <ul>
        {payments.length > 0 ? (
          payments.map(payment => (
            <li key={payment._id}>
              Class: {payment.class?.name} | Status: {payment.status} | Due: {new Date(payment.dueDate).toLocaleDateString()} | Paid: {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : 'Not paid'}
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
