export const intervals = new Set();

export const destoryInterval = (interval) => {
  const target = intervals.values().find((i) => i === interval);
  if (!target) return;
  clearInterval(interval);
  intervals.delete(target);
};
export const destoryIntervals = () => {
  intervals.forEach((i) => clearInterval(i));
  intervals.clear();
};
export const registerInterval = (interval) => {
  intervals.add(interval);
};
