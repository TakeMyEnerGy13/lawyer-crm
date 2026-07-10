// Telegram notification on new client, sent straight from the browser.
// The token belongs to a throwaway bot created for this test task only —
// it ships in the public bundle by design (see README, security tradeoffs).
const BOT_TOKEN = '8694560136:AAGws739WkZx8S-Q_NwBSciqXaRwqyGJlCY';
const CHAT_ID = '1348477787';

export function notifyNewClient(input: { name: string; phone: string; caseNote: string }): void {
  const lines = [
    `Новый клиент: ${input.name}`,
    input.phone && `Телефон: ${input.phone}`,
    input.caseNote && `Дело: ${input.caseNote}`,
  ].filter(Boolean);

  // Fire-and-forget: a failed notification must never break adding a client.
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: lines.join('\n') }),
  }).catch((e) => console.warn('telegram notify failed', e));
}
