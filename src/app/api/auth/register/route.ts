import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setAuthCookie, signAuthToken } from "@/lib/auth";
import { getUserModel } from "@/models/User";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const User = await getUserModel();

    const body = await req.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    const token = await signAuthToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const res = NextResponse.json(
      { id: user._id.toString(), email: user.email },
      { status: 201 }
    );
    setAuthCookie(res, token);
    return res;
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
