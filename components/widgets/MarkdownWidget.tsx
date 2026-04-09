export default function MarkdownWidget({ content }: { content: string }) {
  return <article className="prose prose-invert max-w-none rounded-lg border border-zinc-800 bg-zinc-900 p-4">{content}</article>;
}
