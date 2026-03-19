export function getReminderRecommendation({ amountCents, dueDate, status }) {
  const now = new Date();
  const due = dueDate ? new Date(dueDate) : now;
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (status === 'paid') {
    return { level: 'none', message: 'Invoice already paid. No follow-up required.' };
  }
  if (diffDays <= -7 || amountCents >= 300000) {
    return { level: 'high', message: 'Send WhatsApp reminder now and schedule email fallback in 4 hours.' };
  }
  if (diffDays <= 0) {
    return { level: 'medium', message: 'Invoice is due or overdue. Send a reminder within the next hour.' };
  }
  return { level: 'low', message: 'Send a soft reminder 24 hours before the due date.' };
}
