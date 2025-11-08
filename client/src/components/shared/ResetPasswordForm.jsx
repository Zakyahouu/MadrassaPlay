import React, { useState } from 'react';

// Reusable ResetPasswordForm
// Props:
// - onSubmit({ newPassword }) => Promise
// - submitLabel (optional)
// - minLength (optional)
const ResetPasswordForm = ({ onSubmit, submitLabel = 'Reset Password', minLength = 6 }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newPassword || newPassword.length < minLength) return setError(`Password must be at least ${minLength} characters`);
    if (newPassword !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await onSubmit({ newPassword });
      setSuccess('Password reset successfully');
      setNewPassword(''); setConfirm('');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}
      <div>
        <label className="text-xs text-gray-700">New password</label>
        <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
      </div>
      <div>
        <label className="text-xs text-gray-700">Confirm password</label>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Working...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
