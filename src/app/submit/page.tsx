import { getOrder } from "@/lib/orders";
import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const { parent } = await searchParams;
  const parentOrder = parent ? await getOrder(parent) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {parentOrder ? `Round ${parentOrder.round + 1}: improve your pitch` : "Test your pitch"}
        </h1>
        <p className="mt-2 text-muted">
          {parentOrder
            ? "Edit the pitch based on Round " +
              parentOrder.round +
              " feedback. Results will be compared side by side."
            : "Tell us about your startup and the features you're deciding between."}
        </p>
      </div>
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
    </div>
  );
}
