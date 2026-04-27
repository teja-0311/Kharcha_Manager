import { NextRequest, NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";
import { getUserModel } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthPayload(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const User = await getUserModel();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { id: user._id.toString(), email: user.email },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
