// Returns date in YYYY-MM-DD format based on local timezone
export const getLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Returns the day of the week (e.g., 'Mon', 'Tue')
export const getDayOfWeek = (date = new Date()) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// Returns the day of the month (e.g., '15')
export const getDayOfMonth = (date = new Date()) => {
  return String(date.getDate());
};