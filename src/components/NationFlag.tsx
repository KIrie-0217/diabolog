const flags: Record<string, string> = {
  Japan: "🇯🇵",
  Taiwan: "🇹🇼",
  China: "🇨🇳",
  Malaysia: "🇲🇾",
  USA: "🇺🇸",
};

export function NationFlag({ nationality }: { nationality?: string | null }) {
  if (!nationality) return null;
  const flag = flags[nationality] ?? "";
  return <span>{flag} {nationality}</span>;
}
