import { getOrder } from "@/lib/orders";
import { Badge, Stepper } from "@/components/ui";
import { BarChartIcon, CreditCardIcon, GitCompareIcon, LinkIcon, QuoteIcon } from "@/components/icons";
import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const { parent } = await searchParams;
  const parentOrder = parent ? await getOrder(parent) : null;

  const next = [
    { icon: <CreditCardIcon size={18} />, title: "Pay $5 once", body: "Secure one-time checkout through Whop." },
    { icon: <LinkIcon size={18} />, title: "Get a voting link", body: "Participants recruited via Terac open it and rank your features." },
    { icon: <BarChartIcon size={18} />, title: "Watch the ranking form", body: "Borda-count points, first-place votes and a Build This First pick." },
    { icon: <QuoteIcon size={18} />, title: "Read the why", body: "Every voter explains their #1 in one line." },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="mx-auto max-w-md">
        <Stepper current={0} />
      </div>

      <div className="max-w-2xl">
        {parentOrder && (
          <Badge tone="accent" className="mb-3">
            <GitCompareIcon size={13} /> Round {parentOrder.round + 1} of {parentOrder.company_name}
          </Badge>
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {parentOrder ? `Round ${parentOrder.round + 1}: improve your pitch` : "Test your pitch"}
        </h1>
        <p className="mt-3 text-lg text-muted">
          {parentOrder
            ? "Edit the pitch based on Round " +
              parentOrder.round +
              " feedback. Results will be compared side by side."
            : "Tell us about your startup and the features you're deciding between."}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <SubmitForm
          parentOrderId={parentOrder?.id}
          initial={
            parentOrder
              ? {
                  companyName: parentOrder.company_name,
                  description: parentOrder.description,
                  features: parentOrder.features,
                }
              : undefined
          }
        />

        <aside className="card space-y-5 lg:sticky lg:top-24" aria-labelledby="next-steps-heading">
          <div>
            <p className="eyebrow">What happens next</p>
            <h2 id="next-steps-heading" className="mt-1 text-lg font-semibold">
              $5 gets you real answers
            </h2>
          </div>
          <ol className="space-y-4">
            {next.map((n) => (
              <li key={n.title} className="flex gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-soft-fg">
                  {n.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-sm text-muted">{n.body}</p>
                </div>
              </li>
            ))}
          </ol>
          {parentOrder && (
            <p className="rounded-lg bg-subtle p-3 text-sm text-muted">
              This round links to Round {parentOrder.round}, so its results page shows both rounds side by side.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
