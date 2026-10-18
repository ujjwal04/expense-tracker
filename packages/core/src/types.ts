import { z } from "zod";

export const TransactionKindSchema = z.enum(["EXPENSE", "INCOME", "TRANSFER", "INVESTMENT", "REFUND"]);
export type TransactionKind = z.infer<typeof TransactionKindSchema>;

export const DirectionSchema = z.enum(["DEBIT", "CREDIT"]);
export type Direction = z.infer<typeof DirectionSchema>;

export const AccountTypeSchema = z.enum(["SAVINGS", "CREDIT_CARD", "CASH", "WALLET"]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const ChannelSchema = z.enum(["UPI", "CARD", "NETBANKING", "ATM", "AUTOPAY", "CASH", "OTHER"]);
export type Channel = z.infer<typeof ChannelSchema>;

export const SourceSchema = z.enum(["SMS", "STATEMENT", "EMAIL", "MANUAL"]);
export type Source = z.infer<typeof SourceSchema>;

/** Calendar date in IST, e.g. "2026-10-18". */
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const Last4Schema = z.string().regex(/^\d{4}$/);
/** Money is always integer paise, never floats. */
export const PaiseSchema = z.number().int().positive();

/** What a parser extracts from one bank message, before classification. */
export const ParsedSmsSchema = z.object({
  amountPaise: PaiseSchema,
  direction: DirectionSchema,
  date: IsoDateSchema.nullable(),
  merchant: z.string().min(1).nullable(),
  accountLast4: Last4Schema.nullable(),
  accountType: AccountTypeSchema,
  channel: ChannelSchema,
  reference: z.string().nullable(),
});
export type ParsedSms = z.infer<typeof ParsedSmsSchema>;

export const TransactionSchema = z.object({
  id: z.string().min(1),
  amountPaise: PaiseSchema,
  direction: DirectionSchema,
  kind: TransactionKindSchema,
  date: IsoDateSchema,
  merchant: z.string().nullable(),
  category: z.string().nullable(),
  accountType: AccountTypeSchema,
  accountLast4: Last4Schema.nullable(),
  channel: ChannelSchema,
  source: SourceSchema,
  /** Mandates/autopay (EMI, subscriptions), shown separately from variable spend. */
  fixed: z.boolean(),
});
export type Transaction = z.infer<typeof TransactionSchema>;
