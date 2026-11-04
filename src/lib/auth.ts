import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE = "partshop_session";
const SESSION_DURATION_DAYS = 30;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type SessionRole = "CUSTOMER" | "SELLER" | "ADMIN";
export type SessionSellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface SessionUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: SessionRole;
  city: string | null;
  sellerProfileId: string | null;
  shopName: string | null;
  sellerStatus: SessionSellerStatus | null;
}

export async function createSession(userId: string): Promise<void> {
  const secret = getSecret();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: { userId, token: crypto.randomUUID(), expiresAt },
  });

  const token = await new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sessionId = payload.sid as string | undefined;
    if (!sessionId) return null;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            sellerProfile: { select: { id: true, shopName: true, status: true } },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      phone: session.user.phone,
      role: session.user.role,
      city: session.user.city,
      sellerProfileId: session.user.sellerProfile?.id ?? null,
      shopName: session.user.sellerProfile?.shopName ?? null,
      sellerStatus: session.user.sellerProfile?.status ?? null,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const sessionId = payload.sid as string | undefined;
      if (sessionId) {
        await prisma.session.deleteMany({ where: { id: sessionId } });
      }
    } catch {
      // token invalid — nothing to clean up server-side
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}

export function isApprovedSeller(user: SessionUser | null): boolean {
  return !!user && user.role === "SELLER" && user.sellerStatus === "APPROVED" && !!user.sellerProfileId;
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
