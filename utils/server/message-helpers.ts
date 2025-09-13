export function extractPlainText(parts: any[] | undefined): string {
  return parts?.map((p: any) => p.text).join(" ") ?? "";
}
