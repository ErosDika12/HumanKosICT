import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { AuthorizationError, getCurrentUser, requireRole } from "@/lib/auth/current-user";
import { getActivityCategorySummary } from "@/lib/data/municipality";

export default async function MunicipalityPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AccessNote message={
        <>
          <Link href="/login?next=/municipality" className="text-brand underline underline-offset-2">
            Sign in
          </Link>{" "}
          as the municipality analyst persona to view this preview.
        </>
      } />
    );
  }

  try {
    await requireRole("MUNICIPALITY_ANALYST");
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return (
        <AccessNote
          message={`Access denied — municipality data is analyst-only, aggregate-only. Your account (${user.role.toLowerCase()}) doesn't have that role.`}
        />
      );
    }
    throw err;
  }

  const summary = await getActivityCategorySummary();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <DemoBadge className="self-start" />
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Municipality preview — aggregate activity counts
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Phase 2 placeholder for the full Phase 7 dashboard (area-level demand/supply gaps,
          small-cell suppression). This view is deliberately aggregate-only: it exposes category
          counts and nothing about who submitted or attended anything.
        </p>
      </div>

      <table className="w-full overflow-hidden rounded-xl border border-border text-sm">
        <thead className="bg-surface-muted text-left text-foreground-muted">
          <tr>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Published activities</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row) => (
            <tr key={row.category} className="border-t border-border">
              <td className="px-4 py-2 capitalize text-foreground">{row.category}</td>
              <td className="px-4 py-2 text-foreground">{row.activityCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccessNote({ message }: { message: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <DemoBadge className="self-start" />
      <p className="text-sm text-foreground-muted">{message}</p>
    </div>
  );
}
