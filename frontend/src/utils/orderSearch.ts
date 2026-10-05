/**
 * Order Dispatch & Tracking: which order's details should be open while the admin is searching.
 * Returns:
 *  - undefined  -> leave the current selection alone (no search text, or it is still among the matches)
 *  - null       -> nothing matches, so close the details (never leave an unrelated order open)
 *  - "<invoice>" -> switch to the first match, so the AWB / shipment fields appear without a click
 */
export function selectionForSearch(
  query: string,
  matchingInvoices: string[],
  currentInvoice: string | null
): string | null | undefined {
  if (!query.trim()) return undefined;
  if (matchingInvoices.length === 0) return null;
  if (currentInvoice && matchingInvoices.includes(currentInvoice)) return undefined;
  return matchingInvoices[0];
}
