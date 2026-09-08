import PlannerApp from "@/app/planner-app";

export default async function FullDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  return <PlannerApp view="hoje" initialDate={initialDate} />;
}
