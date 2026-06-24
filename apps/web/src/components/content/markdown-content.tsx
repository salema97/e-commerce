interface MarkdownContentProps {
  markdown: string;
  className?: string;
}

export function MarkdownContent({ markdown, className }: MarkdownContentProps) {
  const blocks = markdown.split(/\n{2,}/).filter(Boolean);

  return (
    <div className={className}>
      {blocks.map((block) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={trimmed} className="mb-3 mt-6 font-bold uppercase first:mt-0">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={trimmed} className="mb-3 font-bold uppercase">
              {trimmed.slice(2)}
            </h2>
          );
        }
        if (trimmed.startsWith('- ')) {
          const items = trimmed.split('\n').map((line) => line.replace(/^- /, '').trim());
          return (
            <ul key={trimmed} className="mb-4 list-disc space-y-1 pl-5">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={trimmed} className="mb-4 leading-relaxed text-muted-foreground last:mb-0">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
