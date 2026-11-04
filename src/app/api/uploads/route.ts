import { NextRequest, NextResponse } from "next/server";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import { getSessionUser } from "@/lib/auth";
import { ATTACHMENT_LIMITS, isAttachmentKind } from "@/lib/attachments";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json(
      { error: "برای بارگذاری فایل باید با حساب مشتری وارد شوید", field: "attachments" },
      { status: 403 }
    );
  }

  let body: HandleUploadPresignedBody;
  try {
    body = (await request.json()) as HandleUploadPresignedBody;
  } catch {
    return NextResponse.json(
      { error: "درخواست بارگذاری نامعتبر است", field: "attachments" },
      { status: 400 }
    );
  }

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        const prefix = `requests/${user.id}/`;
        if (!pathname.startsWith(prefix)) {
          throw new Error("مسیر بارگذاری نامعتبر است");
        }

        let payload: { kind?: unknown } = {};
        try {
          payload = JSON.parse(clientPayload ?? "{}");
        } catch {
          throw new Error("اطلاعات فایل نامعتبر است");
        }

        if (!isAttachmentKind(payload.kind)) {
          throw new Error("نوع فایل نامعتبر است");
        }

        const limit = ATTACHMENT_LIMITS[payload.kind];
        const validUntil = Date.now() + 60 * 60 * 1000;
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: [...limit.types],
          maximumSizeInBytes: limit.max,
          validUntil,
        });

        return {
          token,
          urlOptions: {
            allowedContentTypes: [...limit.types],
            maximumSizeInBytes: limit.max,
            validUntil,
            addRandomSuffix: false,
            allowOverwrite: false,
          },
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error && /[\u0600-\u06FF]/.test(error.message)
      ? error.message
      : "بارگذاری فایل انجام نشد؛ دوباره تلاش کنید";
    return NextResponse.json({ error: message, field: "attachments" }, { status: 400 });
  }
}
