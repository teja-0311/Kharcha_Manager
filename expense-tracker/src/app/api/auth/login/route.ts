import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setAuthCookie, signAuthToken } from "@/lib/auth";
import { getUserModel } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const User = await getUserModel();

    const body = await req.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signAuthToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const res = NextResponse.json(
      { id: user._id.toString(), email: user.email },
      { status: 200 }
    );
    setAuthCookie(res, token);
    return res;
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
