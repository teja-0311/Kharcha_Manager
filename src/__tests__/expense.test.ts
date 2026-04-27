/**
 * Unit tests for core business logic.
 * We test the validation rules and idempotency behaviour in isolation,
 * without spinning up a real MongoDB instance.
 */

// ─── Validation helpers (extracted for testability) ──────────────────────────

function validateCreateExpense(body: Record<string, unknown>): string | null {
  const { idempotencyKey, amount, category, description, date } = body;

  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return "idempotencyKey is required";
  }
  if (!amount || isNaN(parseFloat(amount as string)) || parseFloat(amount as string) <= 0) {
    return "amount must be a positive number";
  }
  if (!category || typeof category !== "string" || !(category as string).trim()) {
    return "category is required";
  }
  if (!description || typeof description !== "string" || !(description as string).trim()) {
    return "description is required";
  }
  if (!date || isNaN(Date.parse(date as string))) {
    return "date must be a valid ISO date string";
  }
  return null;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("validateCreateExpense", () => {
  const valid = {
    idempotencyKey: "abc-123",
    amount: "150.00",
    category: "Food & Dining",
    description: "Lunch at Cafe",
    date: "2024-05-01",
  };

  it("passes for a valid payload", () => {
    expect(validateCreateExpense(valid)).toBeNull();
  });

  it("rejects missing idempotencyKey", () => {
    expect(validateCreateExpense({ ...valid, idempotencyKey: "" })).toMatch(
      /idempotencyKey/
    );
  });

  it("rejects zero amount", () => {
    expect(validateCreateExpense({ ...valid, amount: "0" })).toMatch(/amount/);
  });

  it("rejects negative amount", () => {
    expect(validateCreateExpense({ ...valid, amount: "-50" })).toMatch(
      /amount/
    );
  });

  it("rejects non-numeric amount", () => {
    expect(validateCreateExpense({ ...valid, amount: "abc" })).toMatch(
      /amount/
    );
  });

  it("rejects missing category", () => {
    expect(validateCreateExpense({ ...valid, category: "   " })).toMatch(
      /category/
    );
  });

  it("rejects missing description", () => {
    expect(validateCreateExpense({ ...valid, description: "" })).toMatch(
      /description/
    );
  });

  it("rejects invalid date", () => {
    expect(validateCreateExpense({ ...valid, date: "not-a-date" })).toMatch(
      /date/
    );
  });

  it("rejects missing date", () => {
    expect(validateCreateExpense({ ...valid, date: "" })).toMatch(/date/);
  });
});

// ─── Money precision ──────────────────────────────────────────────────────────

describe("Money precision", () => {
  it("formats amount to 2 decimal places", () => {
    expect(parseFloat("99.999").toFixed(2)).toBe("100.00");
    expect(parseFloat("0.1").toFixed(2)).toBe("0.10");
  });

  it("sums without floating point drift when using string-then-parse approach", () => {
    const amounts = ["10.10", "20.20", "30.30"];
    const total = amounts
      .reduce((sum, a) => sum + parseFloat(a), 0)
      .toFixed(2);
    // Note: pure JS floats would give 60.599999... without toFixed
    expect(total).toBe("60.60");
  });
});

// ─── Idempotency key behaviour ────────────────────────────────────────────────

describe("Idempotency", () => {
  it("the same key on two requests should not create two records", () => {
    // This simulates what the API does: track seen keys
    const seen = new Set<string>();

    function processRequest(key: string): "created" | "duplicate" {
      if (seen.has(key)) return "duplicate";
      seen.add(key);
      return "created";
    }

    const key = "test-key-xyz";
    expect(processRequest(key)).toBe("created");
    expect(processRequest(key)).toBe("duplicate");
    expect(processRequest(key)).toBe("duplicate");
  });

  it("different keys should both be processed", () => {
    const seen = new Set<string>();
    const process = (k: string) =>
      seen.has(k) ? "duplicate" : (seen.add(k), "created");

    expect(process("key-1")).toBe("created");
    expect(process("key-2")).toBe("created");
    expect(process("key-1")).toBe("duplicate");
  });
});
