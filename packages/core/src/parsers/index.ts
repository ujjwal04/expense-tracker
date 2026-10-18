import { ParsedSmsSchema, type ParsedSms } from "../types";
import { genericParser } from "./generic";
import type { RawSms, SmsParser } from "./types";

export type { RawSms, SmsParser } from "./types";
export { genericParser } from "./generic";

/** Bank-specific parsers go before the generic one. */
export const DEFAULT_PARSERS: readonly SmsParser[] = [genericParser];

export type ParseResult = ParsedSms & { parserId: string };

/** Tries each matching parser in order; the first schema-valid result wins. */
export function parseSms(sms: RawSms, parsers: readonly SmsParser[] = DEFAULT_PARSERS): ParseResult | null {
  for (const parser of parsers) {
    if (!parser.matches(sms)) continue;
    const result = ParsedSmsSchema.safeParse(parser.parse(sms));
    if (result.success) return { ...result.data, parserId: parser.id };
  }
  return null;
}
