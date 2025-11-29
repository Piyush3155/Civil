import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AnalyticsPage() {

  // Redirect to the first project's analytics or a selection page
  redirect("/analytics/overview");
}
