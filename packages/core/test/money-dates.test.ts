import { describe, expect, it } from "vitest";
import { findDateInText, formatInr, istDate, parseAmountToPaise, parseSmsDate, shiftMonth } from "../src";

describe("parseAmountToPaise", () => {
  it.each([
    ["500", 50000],
    ["1,499.00", 149900],
    ["1,23,456.7", 12345670],
    ["0.05", 5],
  ])("%s -> %i paise", (raw, paise) => {
    expect(parseAmountToPaise(raw)).toBe(paise);
  });

  it("rejects non-amounts", () => {
    expect(parseAmountToPaise("12.345")).toBeNull();
    expect(parseAmountToPaise("abc")).toBeNull();
  });
});

it("formats paise as Indian rupees", () => {
  expect(formatInr(12345678)).toBe("₹1,23,456.78");
});

describe("parseSmsDate", () => {
  it.each([
    ["14-10-26", "2026-10-14"],
    ["05/10/2026", "2026-10-05"],
    ["12-Oct-26", "2026-10-12"],
    ["3 Oct 2026", "2026-10-03"],
    ["2026-10-18", "2026-10-18"],
  ])("%s -> %s", (raw, iso) => {
    expect(parseSmsDate(raw)).toBe(iso);
  });

  it("rejects impossible dates", () => {
    expect(parseSmsDate("31-02-26")).toBeNull();
    expect(parseSmsDate("12-Foo-26")).toBeNull();
  });
});

it("finds the first valid date in a message", () => {
  expect(findDateInText("Rs 10 paid on 31-02-26, settled on 01-03-26")).toBe("2026-03-01");
});

it("moves between months across year boundaries", () => {
  expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  expect(shiftMonth("2026-10", 0)).toBe("2026-10");
});

it("uses the Indian calendar date, not UTC", () => {
  // 20:00 UTC is 01:30 the next day in IST.
  expect(istDate(new Date("2026-10-18T20:00:00Z"))).toBe("2026-10-19");
});
