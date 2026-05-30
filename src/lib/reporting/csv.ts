import type { PurchaseExport } from "@/lib/reporting/reports";

const CSV_HEADERS = ["구매일", "품목", "브랜드", "카테고리", "매장", "수량", "금액"];

function escapeCsvCell(value: string | number) {
  const text = String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function purchasesToCsv(rows: PurchaseExport[]) {
  const lines = [
    CSV_HEADERS,
    ...rows.map((row) => [
      row.purchaseDate,
      row.itemName,
      row.brand,
      row.category,
      row.storeName || "미지정 매장",
      row.quantity,
      row.price,
    ]),
  ];

  return lines.map((line) => line.map(escapeCsvCell).join(",")).join("\r\n");
}
