const KAVENEGAR_BASE = "https://api.kavenegar.com/v1";

export function isSmsConfigured() {
  return Boolean(
    process.env.KAVENEGAR_API_KEY &&
      (process.env.KAVENEGAR_OTP_TEMPLATE || process.env.KAVENEGAR_SENDER)
  );
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_OTP_TEMPLATE;
  const sender = process.env.KAVENEGAR_SENDER;

  if (!apiKey || (!template && !sender)) {
    throw new Error("سرویس پیامک پیکربندی نشده است");
  }

  const endpoint = template ? "verify/lookup.json" : "sms/send.json";
  const body = new URLSearchParams({ receptor: phone });

  if (template) {
    body.set("token", code);
    body.set("template", template);
  } else {
    body.set("sender", sender!);
    body.set("message", `کد ورود شما به پارت شاپ: ${code}`);
  }

  const response = await fetch(`${KAVENEGAR_BASE}/${apiKey}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { return?: { status?: number; message?: string } }
    | null;

  if (!response.ok || payload?.return?.status !== 200) {
    console.error("Kavenegar error:", response.status, payload?.return?.message ?? payload);
    throw new Error("ارسال پیامک انجام نشد");
  }
}
