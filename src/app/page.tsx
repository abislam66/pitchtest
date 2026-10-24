import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Which feature should you build first?</h1>
        <p className="text-lg text-muted">
          Describe your startup and 3–5 features you&apos;re considering. Real people rank them and
          tell you why. You get a &ldquo;Build This First&rdquo; recommendation based on their actual votes.
        </p>
        <Link href="/submit" className="btn">
          Test my pitch — $5
        </Link>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1. Pitch", "Company name, one-paragraph description, 3–5 proposed features."],
          ["2. Real votes", "Recruited participants rank your features and give a one-line reason."],
          ["3. Build this first", "Results page with the ranking, the reasons, and round-over-round comparison."],
        ].map(([title, body]) => (
          <div key={title} className="card">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
