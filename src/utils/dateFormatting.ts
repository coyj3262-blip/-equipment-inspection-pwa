/**
 * Date Formatting Utilities
 */

/**
 * Formats a timestamp for the "Member Since" display
 * Handles undefined, null, NaN, and invalid date values gracefully
 */
export function formatMemberSinceDate(createdAt: number | undefined): string {
  if (!createdAt || isNaN(createdAt)) {
    return "Date not available";
  }

  const date = new Date(createdAt);
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
