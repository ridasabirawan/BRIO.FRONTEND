"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getConversationAnalytics,
  getResponsesAnalytics,
  getTokenAnalytics,
} from "@/utils/analytics/get";

type Row = { date: string; chats: number; responses: number; tokens: number };

export default function ExportReportButton({
  chatbotId,
}: {
  chatbotId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const [chats, responses, tokens] = await Promise.all([
        getConversationAnalytics(chatbotId),
        getResponsesAnalytics(chatbotId),
        getTokenAnalytics(chatbotId),
      ]);

      // Merge the three series by date.
      const byDate = new Map<string, Row>();
      const ensure = (d: string): Row => {
        let r = byDate.get(d);
        if (!r) {
          r = { date: d, chats: 0, responses: 0, tokens: 0 };
          byDate.set(d, r);
        }
        return r;
      };
      chats.forEach((r: any) => (ensure(r.date).chats = r.chats));
      responses.forEach((r: any) => (ensure(r.date).responses = r.responses));
      tokens.forEach((r: any) => (ensure(r.date).tokens = r.tokens));

      const rows = Array.from(byDate.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      if (rows.length === 0) {
        toast.info("No analytics data to export yet.");
        return;
      }

      const totals = rows.reduce(
        (acc, r) => ({
          chats: acc.chats + r.chats,
          responses: acc.responses + r.responses,
          tokens: acc.tokens + r.tokens,
        }),
        { chats: 0, responses: 0, tokens: 0 }
      );

      const csv = [
        `Brio.chat analytics report`,
        `Chatbot ID,${chatbotId}`,
        `Generated,${new Date().toISOString()}`,
        ``,
        `Date,Chats,Responses,Tokens`,
        ...rows.map((r) => `${r.date},${r.chats},${r.responses},${r.tokens}`),
        ``,
        `Total,${totals.chats},${totals.responses},${totals.tokens}`,
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brio-analytics-${chatbotId.slice(0, 8)}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Report downloaded");
    } catch (error) {
      console.error("Export report error:", error);
      toast.error("Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="mt-4 flex items-center sm:mt-0"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <DownloadIcon className="mr-2 h-4 w-4" />
      )}
      Export Report
    </Button>
  );
}
