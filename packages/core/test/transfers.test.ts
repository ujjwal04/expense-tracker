import { describe, expect, it } from "vitest";
import { isOwnerName, maskSensitive, findMaskingIssues, transactionFromSms } from "../src";
import { IDFC_CREDIT_NO_SENDER, IDFC_UPI_PAYMENT, IDFC_UPI_TO_SELF } from "./fixtures/idfc-sms";

const receivedAt = new Date("2026-10-18T14:00:00Z");
const ownerNames = ["Asha Rao"];

describe("isOwnerName", () => {
  it("matches the owner's name despite spelling and case differences", () => {
    expect(isOwnerName("ASHA RAO", ownerNames)).toBe(true);
    expect(isOwnerName("AASHA RAO", ownerNames)).toBe(true);
  });

  it("doesn't match other people or missing names", () => {
    expect(isOwnerName("RAHUL KUMAR", ownerNames)).toBe(false);
    expect(isOwnerName("ASHA RAO", [])).toBe(false);
    expect(isOwnerName(null, ownerNames)).toBe(false);
  });
});

describe("account-to-account transfers", () => {
  it("treats money sent to the owner's own name as a self transfer, not spending", () => {
    const result = transactionFromSms({ body: IDFC_UPI_TO_SELF.body }, { receivedAt, ownerNames });
    expect(result?.transaction).toMatchObject({ kind: "TRANSFER", category: "Self transfer" });
  });

  it("counts it as spending until the owner's name is known", () => {
    const result = transactionFromSms({ body: IDFC_UPI_TO_SELF.body }, { receivedAt });
    expect(result?.transaction.kind).toBe("EXPENSE");
  });

  it("treats money received from the owner's own name as a self transfer", () => {
    const body = "Your A/c XXXXXXX1234 has been credited with Rs. 500.00 on 18-10-2026. Info: IMPS/600000000005/ASHA RAO.\nNew bal: Rs. 50,500.00. Team IDFC FIRST Bank";
    const result = transactionFromSms({ body }, { receivedAt, ownerNames });
    expect(result?.transaction).toMatchObject({ kind: "TRANSFER", category: "Self transfer" });
  });

  it("puts IMPS/NEFT payments to other people under People", () => {
    const body = "Your A/c XXXXXXX1234 has been debited with Rs. 2,000.00 on 18-10-2026. Info: IMPS/600000000006/RAHUL KUMAR.\nNew bal: Rs. 48,000.00. Team IDFC FIRST Bank";
    const result = transactionFromSms({ body }, { receivedAt, ownerNames });
    expect(result?.transaction).toMatchObject({ kind: "EXPENSE", category: "People" });
  });

  it("leaves UPI payments to unknown names uncategorized, since they're often shops", () => {
    const body = IDFC_UPI_PAYMENT.body.replace("SHARMA BAKERS", "GUPTA GENERAL");
    expect(transactionFromSms({ body }, { receivedAt, ownerNames })?.transaction.category).toBeNull();
  });

  it("keeps credits without a sender as income", () => {
    const result = transactionFromSms({ body: IDFC_CREDIT_NO_SENDER.body }, { receivedAt, ownerNames });
    expect(result?.transaction).toMatchObject({ kind: "INCOME", category: null });
  });

  it("masks the balance in the no-sender format", () => {
    const masked = maskSensitive(IDFC_CREDIT_NO_SENDER.body);
    expect(masked).toContain("balance [MASKED]");
    expect(findMaskingIssues(masked)).toEqual([]);
  });
});
