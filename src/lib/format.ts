import { format, toZonedTime } from "date-fns-tz";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

const KST_TIME_ZONE = "Asia/Seoul";

export function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKoreanDate(value: string | Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: KST_TIME_ZONE,
  }).format(new Date(value));
}

export function getKstMonthRange(anchor: Date = new Date()) {
  const zonedAnchor = toZonedTime(anchor, KST_TIME_ZONE);
  const currentStart = startOfMonth(zonedAnchor);
  const currentEnd = endOfMonth(zonedAnchor);
  const previousStart = startOfMonth(subMonths(zonedAnchor, 1));
  const previousEnd = endOfMonth(subMonths(zonedAnchor, 1));

  return {
    start: formatKstDate(currentStart),
    end: formatKstDate(currentEnd),
    previousStart: formatKstDate(previousStart),
    previousEnd: formatKstDate(previousEnd),
  };
}

export function formatKstDate(value: Date) {
  return format(value, "yyyy-MM-dd", { timeZone: KST_TIME_ZONE });
}
