import { AnalyticsCharts } from "./_components/analytics-charts";
import ExportReportButton from "./_components/export-report-button";

export default async function AnalyticsPage(props: {
  params: Promise<{ chatbotId: string }>;
}) {
  const params = await props.params;

  return (
    <div className="flex flex-col justify-start items-start px-4 pt-5 gap-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 w-full border-b pb-4">
        <h2 className="mt-6 sm:mt-0 scroll-m-20 text-2xl sm:text-3xl font-semibold tracking-tight transition-colors">
          Chatbot Analytics
        </h2>
        <ExportReportButton chatbotId={params.chatbotId} />
      </div>
      <AnalyticsCharts chatbotId={params.chatbotId} />
    </div>
  );
}
