import { redirect } from "next/navigation";

export default async function AnalyticsPage() {

  // Redirect to the first project's analytics or a selection page
  redirect("/analytics/overview");
}
