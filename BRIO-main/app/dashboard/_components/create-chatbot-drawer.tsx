"use client";

import React, { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Bot, Loader, MoreVertical, PlusIcon, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createChatbot } from "@/drizzle/queries/insert";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateChatbotDrawer() {

  const queryClient = useQueryClient();
  const session = useSession();

  const [chatbotName, setChatbotName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);

  const refreshDashboardSafely = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["usage"],
    });
  };

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();

    if (!chatbotName.trim()) {
      toast.error("Chatbot name cannot be empty");
      return;
    }

    try {
      setIsCreating(true);

      const userId = session.data?.user?.id ?? "";

      const result = await createChatbot({
        name: chatbotName.trim(),
        userId,
      });

      if (result.success) {
        toast.success(result.message || "Chatbot created successfully");

        setOpen(false);
        setChatbotName("");

        setTimeout(() => {
          refreshDashboardSafely();
        }, 50);
      } else {
        toast.error(result.message || "Failed to create chatbot");
      }
    } catch (error) {
      console.error("Error creating chatbot:", error);
      toast.error("Error creating chatbot");
    } finally {
      setIsCreating(false);
    }
  };

  const generateRandomName = async () => {
    setIsGenerating(true);

    const adjectives = [
      "Smart",
      "Clever",
      "Helpful",
      "Friendly",
      "Wise",
      "Quick",
      "Bright",
    ];

    const nouns = [
      "Assistant",
      "Helper",
      "Guide",
      "Buddy",
      "Companion",
      "Advisor",
      "Expert",
    ];

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    setChatbotName(`${randomAdjective} ${randomNoun}`);
    setIsGenerating(false);
  };

  const maxLength = 30;
  const progress = (chatbotName.length / maxLength) * 100;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="mt-4 sm:mt-0 flex items-center"
          size="sm"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Chatbot
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="text-center flex items-center justify-center text-2xl font-semibold">
              <Bot className="mr-2 h-6 w-6" />
              Create New Chatbot
            </DrawerTitle>

            <DrawerDescription className="text-center">
              Give your chatbot a unique name to get started.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="chatbotName" className="text-left">
                Chatbot Name
              </Label>

              <div className="flex gap-2">
                <Input
                  type="text"
                  id="chatbotName"
                  placeholder="Enter chatbot name"
                  value={chatbotName}
                  onChange={(e) =>
                    setChatbotName(e.target.value.slice(0, maxLength))
                  }
                  className="flex-1"
                  disabled={isCreating}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateRandomName}
                  disabled={isGenerating || isCreating}
                  title="Generate random name"
                >
                  {isGenerating ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {chatbotName.length} / {maxLength} characters
                </span>
                <span>
                  {Math.max(0, maxLength - chatbotName.length)} remaining
                </span>
              </div>

              <Progress value={progress} className="h-1" />
            </div>

            {chatbotName && (
              <div className="mt-4">
                <Card className="w-full min-h-[130px] flex flex-col justify-between p-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105 bg-background dark:bg-[#0c0c0d]">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 p-0 mb-2">
                    <CardTitle className="text-base sm:text-lg font-bold line-clamp-2">
                      {chatbotName}
                    </CardTitle>

                    <MoreVertical className="h-5 w-5 text-gray-500 cursor-pointer flex-shrink-0 mt-1 transition-colors duration-300 ease-in-out hover:text-gray-700" />
                  </CardHeader>

                  <CardFooter className="flex flex-col xs:flex-row justify-between items-start xs:items-center w-full gap-2 p-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full text-xs px-2 py-0.5 transition-colors duration-300 ease-in-out bg-purple-500 text-white hover:bg-primary hover:text-primary-foreground">
                        0 Chats
                      </Badge>

                      <Badge className="rounded-full text-xs px-2 py-0.5 transition-colors duration-300 ease-in-out bg-purple-500 text-white hover:bg-primary hover:text-primary-foreground">
                        0 Sources
                      </Badge>
                    </div>

                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Created just now
                    </span>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>

          <DrawerFooter>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e)}
              disabled={!chatbotName.trim() || isCreating}
            >
              {isCreating ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Chatbot
            </Button>

            <DrawerClose asChild>
              <Button type="button" variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}