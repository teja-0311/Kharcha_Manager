export interface ExpenseDTO {
  _id: string;
  idempotencyKey: string;
  amount: string;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpensePayload {
  idempotencyKey: string;
  amount: string;
  category: string;
  description: string;
  date: string;
}

export interface UpdateExpensePayload {
  amount: string;
  category: string;
  description: string;
  date: string;
}

export interface GetExpensesParams {
  category?: string;
  sort?: "date_desc" | "date_asc";
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  email: string;
  newPassword: string;
}

export const CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Housing",
  "Travel",
  "Education",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "bg-orange-100 text-orange-800 border-orange-200",
  Transport: "bg-blue-100 text-blue-800 border-blue-200",
  Shopping: "bg-pink-100 text-pink-800 border-pink-200",
  Entertainment: "bg-purple-100 text-purple-800 border-purple-200",
  Health: "bg-green-100 text-green-800 border-green-200",
  Utilities: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Housing: "bg-red-100 text-red-800 border-red-200",
  Travel: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Education: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Other: "bg-gray-100 text-gray-700 border-gray-200",
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Food & Dining": "🍜",
  Transport: "🚇",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Health: "💊",
  Utilities: "⚡",
  Housing: "🏠",
  Travel: "✈️",
  Education: "📚",
  Other: "📦",
};
