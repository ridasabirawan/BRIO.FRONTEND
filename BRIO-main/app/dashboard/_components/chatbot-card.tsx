"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { deleteChatbot } from "@/drizzle/queries/delete";
import { renameChatbot } from "@/drizzle/queries/update";

interface ChatbotCardProps {
  id: string;
  name: string;
  conversationsCount: number;
  sourcesCount: number;
  createdAt: Date | string;
}

export default function ChatbotCard({
  id,
  name,
  conversationsCount,
  sourcesCount,
  createdAt,
}: ChatbotCardProps) {
  const queryClient = useQueryClient();

  const [isVisible, setIsVisible] = useState(true);
  const [displayName, setDisplayName] = useState(name);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dateObj = typeof createdAt === "string" ? new Date(createdAt) : createdAt;

  const refreshUsageSafely = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["usage"],
    });
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = newName.trim();

    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsRenaming(true);

    try {
      const res = await renameChatbot(id, trimmedName);

      if (res.success) {
        toast.success("Chatbot renamed successfully");
        setDisplayName(trimmedName);
        setIsRenameOpen(false);
        await refreshUsageSafely();
      } else {
        toast.error(res.message || "Failed to rename chatbot");
      }
    } catch (error) {
      console.error("Rename chatbot error:", error);
      toast.error("Failed to rename chatbot");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await deleteChatbot(id);

      if (res.success) {
        toast.success("Chatbot deleted successfully");
        setIsDeleteOpen(false);
        setIsVisible(false);
        await refreshUsageSafely();
      } else {
        toast.error(res.message || "Failed to delete chatbot");
      }
    } catch (error) {
      console.error("Delete chatbot error:", error);
      toast.error("Failed to delete chatbot");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className="relative group">
        <Link href={`/dashboard/chatbot/${id}`}>
          <Card className="w-full min-h-[130px] flex flex-col justify-between p-4 transition-all duration-300 ease-in-out hover:shadow-[0_12px_40px_-10px_rgba(139,92,246,0.5)] hover:border-purple-400/60 hover:scale-105 bg-background/80 dark:bg-[#0c0c0d]/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-0 mb-2">
              <CardTitle className="text-base sm:text-lg font-bold pr-6 line-clamp-2">
                {displayName}
              </CardTitle>
              <div className="w-5 h-5 flex-shrink-0" />
            </CardHeader>

            <CardFooter className="flex flex-col xs:flex-row justify-between items-start xs:items-center w-full gap-2 p-0">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full text-xs px-2 py-0.5 transition-colors duration-300 ease-in-out bg-purple-500 text-white hover:bg-primary hover:text-primary-foreground">
                  {conversationsCount} Chat{conversationsCount !== 1 && "s"}
                </Badge>

                <Badge className="rounded-full text-xs px-2 py-0.5 transition-colors duration-300 ease-in-out bg-purple-500 text-white hover:bg-primary hover:text-primary-foreground">
                  {sourcesCount} Source{sourcesCount !== 1 && "s"}
                </Badge>
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Created {dateObj.toLocaleDateString()}
              </span>
            </CardFooter>
          </Card>
        </Link>

        <div className="absolute right-4 top-4 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="z-50"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsRenameOpen(true);
                }}
              >
                Rename
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsDeleteOpen(true);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename Chatbot</DialogTitle>
              <DialogDescription>
                Enter a new name for your chatbot.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Chatbot name"
                disabled={isRenaming}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewName(displayName);
                  setIsRenameOpen(false);
                }}
                disabled={isRenaming}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isRenaming}>
                {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the chatbot{" "}
              <strong>{displayName}</strong> and all of its trained data
              sources, custom settings, and conversation logs. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}