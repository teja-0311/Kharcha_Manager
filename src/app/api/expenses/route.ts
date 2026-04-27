import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthPayload } from "@/lib/auth";
import Expense from "@/models/Expense";
import mongoose from "mongoose";

/**
 * Serialises an Expense document to a plain object safe for JSON transport.
 * Decimal128 must be stringified to preserve exact precision.
 */
function serializeExpense(doc: InstanceType<typeof Expense>) {
  return {
    _id: doc._id.toString(),
    idempotencyKey: doc.idempotencyKey,
    amount: doc.amount.toString(),
    category: doc.category,
    description: doc.description,
    date: doc.date.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// POST /api/expenses
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> | null = null;
  let userId: mongoose.Types.ObjectId | null = null;
  try {
    await connectDB();

    const auth = await getAuthPayload(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!mongoose.Types.ObjectId.isValid(auth.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = new mongoose.Types.ObjectId(auth.userId);

    body = await req.json();
    const { idempotencyKey, amount, category, description, date } = body as Record<string, unknown>;

    // --- Validation ---
    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      return NextResponse.json(
        { error: "idempotencyKey is required" },
        { status: 400 }
      );
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json(
        { error: "category is required" },
        { status: 400 }
      );
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 }
      );
    }
    if (!date || isNaN(Date.parse(date))) {
      return NextResponse.json(
        { error: "date must be a valid ISO date string" },
        { status: 400 }
      );
    }

    // --- Idempotency: return existing record if key already used ---
    // This makes retries (network failures, double-submits, page reloads) safe.
    const existing = await Expense.findOne({ userId, idempotencyKey });
    if (existing) {
      return NextResponse.json(serializeExpense(existing), { status: 200 });
    }

    const expense = await Expense.create({
      userId,
      idempotencyKey,
      // Store as Decimal128 to preserve exact monetary precision
      amount: mongoose.Types.Decimal128.fromString(
        parseFloat(amount).toFixed(2)
      ),
      category: category.trim(),
      description: description.trim(),
      date: new Date(date),
    });

    return NextResponse.json(serializeExpense(expense), { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/expenses]", err);
    // Duplicate key on a race condition — treat as idempotent success
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "11000"
    ) {
      const idempotencyKey =
        typeof body?.idempotencyKey === "string" ? body.idempotencyKey : null;
      const existing =
        userId && idempotencyKey
          ? await Expense.findOne({ userId, idempotencyKey })
          : null;
      if (existing) {
        return NextResponse.json(serializeExpense(existing), { status: 200 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/expenses?category=Food&sort=date_desc
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const auth = await getAuthPayload(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!mongoose.Types.ObjectId.isValid(auth.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = new mongoose.Types.ObjectId(auth.userId);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort");

    // Build query filter
    const filter: Record<string, unknown> = { userId };
    if (category && category !== "all") {
      filter.category = category;
    }

    // Build sort order — default newest first
    const sortOrder: Record<string, 1 | -1> =
      sort === "date_asc" ? { date: 1 } : { date: -1 };

    const expenses = await Expense.find(filter)
      .sort(sortOrder)
      .lean(); // lean() returns plain objects (faster, less memory)

    const serialized = expenses.map((doc) => ({
      _id: doc._id.toString(),
      idempotencyKey: doc.idempotencyKey,
      // Decimal128 lean result has a $numberDecimal property
      amount: (doc.amount as unknown as mongoose.Types.Decimal128).toString(),
      category: doc.category,
      description: doc.description,
      date: (doc.date as Date).toISOString(),
      createdAt: (doc.createdAt as Date).toISOString(),
      updatedAt: (doc.updatedAt as Date).toISOString(),
    }));

    return NextResponse.json(serialized, { status: 200 });
  } catch (err) {
    console.error("[GET /api/expenses]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
