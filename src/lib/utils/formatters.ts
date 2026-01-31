// src/lib/utils/formatters.ts
import { format } from "date-fns";

/**
 * ✅ Date Handling
 * Store: Firestore Timestamp or ISO String
 * Display: 'dd-mm-yyyy' (e.g., 30-01-2026)
 */
export const formatDate = (date: Date | string | number | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return format(d, "dd-MM-yyyy");
};

export const formatDateTime = (date: Date | string | number | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return format(d, "dd-MM-yyyy HH:mm");
};

/**
 * ✅ Currency Handling
 * Example: 1250.50 → "1,250.50 ฿"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(amount);
};
