/** عرض النص القانوني الذي يحرره المدير: السطر الذي يبدأ بـ# عنوان، والباقي فقرات. */
export function LegalBody({ text }: { text: string }) {
  const blocks = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {blocks.map((line, i) =>
        line.startsWith("#") ? (
          <h2 key={`${i}-${line}`} className="font-display text-xl font-bold">
            {line.replace(/^#+\s*/, "")}
          </h2>
        ) : (
          <p key={`${i}-${line}`} className="text-sm leading-relaxed text-muted-foreground">
            {line.replace(/^[-*]\s*/, "")}
          </p>
        ),
      )}
    </div>
  );
}
