import type { ParsedSms } from "../types";

export interface RawSms {
  body: string;
  sender?: string;
}

/**
 * One parser per bank/format. `matches` is a cheap check (usually the sender ID);
 * `parse` returns null when the message isn't a transaction it understands.
 */
export interface SmsParser {
  id: string;
  matches(sms: RawSms): boolean;
  parse(sms: RawSms): ParsedSms | null;
}
