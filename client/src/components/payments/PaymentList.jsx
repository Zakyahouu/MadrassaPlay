// PaymentList.jsx
import React from 'react';

const PaymentList = ({ payments }) => {
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-4">Payments</h3>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Student</th>
            <th className="py-2">Class</th>
            <th className="py-2">Amount</th>
            <th className="py-2">Due Date</th>
            <th className="py-2">Status</th>
            <th className="py-2">Paid Date</th>
          </tr>
        </thead>
        <tbody>
          {payments && payments.length > 0 ? (
            payments.map(payment => (
              <tr key={payment._id}>
                <td className="py-2">{payment.student?.name}</td>
                <td className="py-2">{payment.class?.name}</td>
                <td className="py-2">{payment.amount}</td>
                <td className="py-2">{new Date(payment.dueDate).toLocaleDateString()}</td>
                <td className="py-2">{payment.status}</td>
                <td className="py-2">{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-2 text-center">No payments found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentList;
