export const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours && minutes) return `${hours}H ${minutes}M`;
  if (hours) return `${hours}H`;
  return `${minutes}M`;
};
