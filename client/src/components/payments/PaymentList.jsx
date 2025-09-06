// PaymentList.jsx
import React from 'react';
import formatDZ from '../../utils/currency';

const PaymentList = ({ payments }) => {
  const list = Array.isArray(payments) ? payments : [];
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-4">Payments</h3>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Date</th>
            <th className="py-2">Student</th>
            <th className="py-2">Class</th>
            <th className="py-2">Kind</th>
            <th className="py-2">Amount</th>
            <th className="py-2">Method</th>
            <th className="py-2">Note</th>
          </tr>
        </thead>
        <tbody>
          {list.length > 0 ? (
            list.map((p) => (
              <tr key={p._id}>
                <td className="py-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</td>
                <td className="py-2">{p.studentId ? `${p.studentId.firstName || ''} ${p.studentId.lastName || ''}`.trim() : ''}</td>
                <td className="py-2">{p.classId?.name || ''}</td>
                <td className="py-2 capitalize">{p.kind || ''}</td>
                <td className="py-2">{typeof p.amount === 'number' ? formatDZ(p.amount) : ''}</td>
                <td className="py-2 capitalize">{p.method || ''}</td>
                <td className="py-2">{p.note || ''}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-2 text-center">No payments found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentList;
