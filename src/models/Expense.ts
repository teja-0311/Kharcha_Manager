import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  idempotencyKey: string;
  amount: mongoose.Types.Decimal128;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpenseLean {
  _id: string;
  userId: string;
  idempotencyKey: string;
  amount: string; // serialized from Decimal128
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Client-generated idempotency key to prevent duplicate submissions
    // on retries (network issues, double-clicks, page reloads).
    idempotencyKey: {
      type: String,
      required: true,
    },
    // Decimal128 preserves exact decimal precision for monetary values,
    // avoiding the floating-point rounding errors of Number (e.g., 0.1 + 0.2).
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: (v: mongoose.Types.Decimal128) =>
          parseFloat(v.toString()) > 0,
        message: "Amount must be a positive value",
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // auto-manages createdAt + updatedAt
  }
);

// Compound index to speed up common query patterns
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1, date: -1 });
ExpenseSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });

// Prevent model re-compilation during hot reload in development
const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
