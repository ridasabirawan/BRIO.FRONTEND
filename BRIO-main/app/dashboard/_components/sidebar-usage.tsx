"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Bot, Cpu, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userDetails } from "@/drizzle/queries/select";

interface UsageProps {
  userId: string;
}

interface UserDetails {
  userId: string;
  noOfTokens: number;
  noOfChatbots: number;
  noOfKnowledgeSources: number;
  planName: string | null;
}

export default function SidebarUsageComponent({ userId }: UsageProps) {
  const { data, error } = useQuery<UserDetails[]>({
    queryKey: ["usage", userId],
    queryFn: () => userDetails(userId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  if (error) {
    return (
      <div className="bg-card p-4 rounded-lg shadow-sm space-y-4 border m-4">
        An error occurred!
      </div>
    );
  }

  const {
    noOfChatbots = 0,
    noOfTokens = 0,
    noOfKnowledgeSources = 0,
    planName = null,
  } = data?.[0] || {};

  const MAX_CHATBOTS =
    planName === "Pro Plan" || planName === "Pro Yearly"
      ? 10
      : planName === "Basic Yearly" || planName === "Basic Plan"
        ? 5
        : 3;

  const MAX_TOKENS =
    planName === "Pro Plan" || planName === "Pro Yearly"
      ? 1000000
      : planName === "Basic Yearly" || planName === "Basic Plan"
        ? 300000
        : 100000;

  const MAX_KNOWLEDGE_SOURCES =
    planName === "Pro Plan" || planName === "Pro Yearly"
      ? 300
      : planName === "Basic Yearly" || planName === "Basic Plan"
        ? 150
        : 50;

  const calculatePercentage = (value: number, max: number) =>
    Math.min((value / max) * 100, 100);

  const isFull = (value: number, max: number) => value >= max;

  const renderUsageItem = (
    label: string,
    value: number,
    max: number,
    icon: React.ReactNode
  ) => {
    const percentage = calculatePercentage(value, max);
    const full = isFull(value, max);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-semibold">{label}</span>
          </div>

          <span
            className={
              full
                ? "text-red-500 font-semibold"
                : "text-foreground-muted font-semibold"
            }
          >
            {full ? "Full" : `${value} / ${max}`}
          </span>
        </div>

        <Progress value={percentage} className="h-1.5" />
      </div>
    );
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm space-y-4 border m-4">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
        Usage Overview
      </h3>

      {renderUsageItem(
        "Chatbots",
        noOfChatbots,
        MAX_CHATBOTS,
        <Bot className="w-5 h-5 text-blue-500" />
      )}

      {renderUsageItem(
        "Tokens",
        noOfTokens,
        MAX_TOKENS,
        <Cpu className="w-5 h-5 text-green-500" />
      )}

      {renderUsageItem(
        "Sources",
        noOfKnowledgeSources,
        MAX_KNOWLEDGE_SOURCES,
        <Database className="w-5 h-5 text-orange-500" />
      )}
    </div>
  );
}