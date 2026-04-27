import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAuthPayload } from "@/lib/auth";
import Expense from "@/models/Expense";

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

function validateExpensePayload(body: Record<string, unknown>) {
  const { amount, category, description, date } = body;
  if (!amount || isNaN(parseFloat(amount as string)) || parseFloat(amount as string) <= 0) {
    return "amount must be a positive number";
  }
  if (!category || typeof category !== "string" || !category.trim()) {
    return "category is required";
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return "description is required";
  }
  if (!date || isNaN(Date.parse(date as string))) {
    return "date must be a valid ISO date string";
  }
  return null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
    }

    const body = await req.json();
    const validationError = validateExpensePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updated = await Expense.findOneAndUpdate(
      { _id: params.id, userId },
      {
        amount: mongoose.Types.Decimal128.fromString(
          parseFloat(body.amount as string).toFixed(2)
        ),
        category: (body.category as string).trim(),
        description: (body.description as string).trim(),
        date: new Date(body.date as string),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(serializeExpense(updated), { status: 200 });
  } catch (err) {
    console.error("[PUT /api/expenses/:id]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
    }

    const deleted = await Expense.findOneAndDelete({ _id: params.id, userId });
    if (!deleted) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/expenses/:id]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
