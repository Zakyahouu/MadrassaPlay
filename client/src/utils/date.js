// Centralized date formatting helpers

export const formatDate = (value, locale = 'en-US', options) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(locale, options || { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Invalid date';
  }
};

export const formatDateTime = (value, locale = 'en-US') => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Invalid date';
  }
};
