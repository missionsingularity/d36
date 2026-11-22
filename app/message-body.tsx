export default function MessageBody({ text }: { text: string }) {
  const body = text.replace(/^(LIVE GEMINI|OFFLINE LOCAL MODE)\s*\n+/, "");
  return (
    <div className="answer-body">
      {body
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) => {
          const lines = block.split("\n");
          if (/^#{1,3}\s/.test(block)) {
            const [title, ...rest] = lines;
            return (
              <section key={i}>
                <h3>{title.replace(/^#+\s*/, "")}</h3>
                {rest.length > 0 && <p>{rest.join("\n")}</p>}
              </section>
            );
          }
          if (
            lines.length > 1 &&
            lines.slice(1).every((line) => /^[-*]\s/.test(line))
          )
            return (
              <section key={i}>
                <p>{lines[0]}</p>
                <ul>
                  {lines.slice(1).map((line, j) => (
                    <li key={j}>{line.replace(/^[-*]\s/, "")}</li>
                  ))}
                </ul>
              </section>
            );
          if (lines.every((l) => /^[-*]\s/.test(l)))
            return (
              <ul key={i}>
                {lines.map((l, j) => (
                  <li key={j}>{l.replace(/^[-*]\s/, "")}</li>
                ))}
              </ul>
            );
          return <p key={i}>{block}</p>;
        })}
    </div>
  );
}
