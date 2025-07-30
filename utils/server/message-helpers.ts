/**
 * Utility function to extract plain text from message parts
 * @param parts - Array of message parts
 * @returns Plain text string
 */
export function extractPlainText(parts: any[] | undefined): string {
  return parts?.map((p: any) => p.text).join(" ") ?? "";
}
