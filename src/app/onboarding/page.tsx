import { OnboardingClient } from "@/components/OnboardingClient";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserInterests } from "@/lib/data/interests";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  const initialSelected = user ? await getUserInterests(user.id) : [];

  return <OnboardingClient initialSelected={initialSelected} isAuthenticated={Boolean(user)} />;
}
