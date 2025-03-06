export function calculateRemainingTime(deadline: Date): string {
  const now = new Date();
  const timeDifference = deadline.getTime() - now.getTime();

  if (timeDifference <= 0) {
    return "Quête expirée";
  }

  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  if (days > 0) {
    return `${days} jour${days > 1 ? "s" : ""} ${hours} heure${hours > 1 ? "s" : ""}`;
  }
  return `${hours} heure${hours > 1 ? "s" : ""}`;
}
