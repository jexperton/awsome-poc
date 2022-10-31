const daysAgo = (date: Date) => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const clonedDate = new Date(date);
  clonedDate.setUTCHours(0, 0, 0, 0);
  return Math.trunc((now.getTime() - clonedDate.getTime()) / 86400000);
};

export default daysAgo;
