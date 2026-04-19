export const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours && minutes) return `${hours} ساعت و  ${minutes} دقیقه`;
  if (hours) return `${hours} ساعت`;
  return `${minutes} دقیقه`;
};
