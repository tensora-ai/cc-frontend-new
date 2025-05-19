import DashboardPage from "@/components/dashboard/dashboard-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tensora Count | Dashboard",
  description: "Real-time crowd counting dashboard for monitoring and visualization.",
};

export default function Page() {
  return <DashboardPage />;
}