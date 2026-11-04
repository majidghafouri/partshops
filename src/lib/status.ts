import type { OfferStatus, RequestStatus, SellerStatus } from "./types";

export const REQUEST_DURATION_MINUTES = 30;
export const REQUEST_DURATION_MS = REQUEST_DURATION_MINUTES * 60 * 1000;

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  OPEN: "در انتظار پیشنهاد",
  ACCEPTED: "پیشنهاد پذیرفته شد",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل شده",
  EXPIRED: "منقضی شده",
  CANCELLED: "لغو شده",
};

export const REQUEST_STATUS_CLASSES: Record<RequestStatus, string> = {
  OPEN: "bg-primary/10 text-primary border border-primary/20",
  ACCEPTED: "bg-success/10 text-success border border-success/20",
  SHIPPED: "bg-accent/10 text-accent border border-accent/20",
  DELIVERED: "bg-success/10 text-success border border-success/20",
  EXPIRED: "bg-warning/10 text-warning border border-warning/20",
  CANCELLED: "bg-danger/10 text-danger border border-danger/20",
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  PENDING: "در انتظار پاسخ",
  ACCEPTED: "پذیرفته شده",
  REJECTED: "رد شده",
  WITHDRAWN: "پس گرفته شده",
};

export const OFFER_STATUS_CLASSES: Record<OfferStatus, string> = {
  PENDING: "bg-primary/10 text-primary border border-primary/20",
  ACCEPTED: "bg-success/10 text-success border border-success/20",
  REJECTED: "bg-danger/10 text-danger border border-danger/20",
  WITHDRAWN: "bg-surface-hover text-muted border border-border",
};

export const SELLER_STATUS_LABELS: Record<SellerStatus, string> = {
  PENDING: "در انتظار تایید",
  APPROVED: "تایید شده",
  REJECTED: "رد شده",
  SUSPENDED: "تعلیق شده",
};

export const SELLER_STATUS_CLASSES: Record<SellerStatus, string> = {
  PENDING: "bg-warning/10 text-warning border border-warning/20",
  APPROVED: "bg-success/10 text-success border border-success/20",
  REJECTED: "bg-danger/10 text-danger border border-danger/20",
  SUSPENDED: "bg-surface-hover text-muted border border-border",
};

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function remainingSeconds(expiresAt: string | Date, now = Date.now()): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(minutes)}:${new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(seconds)}`;
}
