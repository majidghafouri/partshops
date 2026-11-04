import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function loginRedirectUrl(request: NextRequest, reason: string): string {
  const url = new URL("/auth/login", request.url);
  url.searchParams.set("error", reason);
  return url.toString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const stateCookie = request.cookies.get("google_oauth_state")?.value;

  if (!code || !stateParam || !stateCookie) {
    return NextResponse.redirect(loginRedirectUrl(request, "google_failed"));
  }

  // validate state (CSRF protection)
  let parsedState: { s?: string; next?: string };
  try {
    parsedState = JSON.parse(stateParam);
  } catch {
    return NextResponse.redirect(loginRedirectUrl(request, "google_failed"));
  }
  if (parsedState.s !== stateCookie) {
    return NextResponse.redirect(loginRedirectUrl(request, "google_failed"));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(loginRedirectUrl(request, "google_not_configured"));
  }

  try {
    // exchange code for tokens
    const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokens: GoogleTokenResponse = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      console.error("Google token exchange failed:", tokens.error);
      return NextResponse.redirect(loginRedirectUrl(request, "google_failed"));
    }

    // fetch profile
    const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile: GoogleUserInfo = await profileRes.json();
    if (!profileRes.ok || !profile.sub) {
      console.error("Google userinfo failed:", profile);
      return NextResponse.redirect(loginRedirectUrl(request, "google_failed"));
    }

    const email = profile.email?.toLowerCase();

    // upsert: match by googleId first, then by verified email
    let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });

    if (!user && email && profile.email_verified) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        // link google to existing account
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.sub, avatar: profile.picture ?? user.avatar },
        });
      }
    }

    if (!user) {
      // create new account (random password — social login only)
      const randomPassword = await hashPassword(crypto.randomUUID() + crypto.randomUUID());
      try {
        user = await prisma.user.create({
          data: {
            name: profile.name ?? "کاربر گوگل",
            email,
            password: randomPassword,
            googleId: profile.sub,
            avatar: profile.picture,
            role: "CUSTOMER",
          },
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes("Unique constraint")) {
          return NextResponse.redirect(loginRedirectUrl(request, "google_email_taken"));
        }
        throw error;
      }
    }

    await createSession(user.id);

    const res = NextResponse.redirect(new URL(parsedState.next || "/", request.url));
    res.cookies.delete("google_oauth_state");
    return res;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(loginRedirectUrl(request, "google_failed"));
  }
}
