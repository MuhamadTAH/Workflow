/*
=================================================================
SHARED UTILITIES - Formatters
=================================================================
Common formatting functions for dates, numbers, and text.
*/

export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return d.toLocaleTimeString();
    case 'datetime':
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    default:
      return d.toLocaleDateString();
  }
};

export const formatNumber = (number, options = {}) => {
  if (typeof number !== 'number') return number;
  
  const {
    decimals = 0,
    currency = false,
    currencyCode = 'USD',
    percentage = false
  } = options;
  
  if (percentage) {
    return (number * 100).toFixed(decimals) + '%';
  }
  
  if (currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  }
  
  return number.toFixed(decimals);
};

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const truncateText = (text, maxLength = 100, ellipsis = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + ellipsis;
};

export const capitalizeFirst = (text) => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const camelToTitle = (text) => {
  if (!text) return text;
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};