import { getActivityLogs } from "@/drizzle/queries/admin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  ban_user: "Banned user",
  unban_user: "Unbanned user",
  update_role: "Updated role",
  delete_source: "Deleted source",
};

export default async function ActivityLogsPage() {
  const logs = await getActivityLogs(200);

  return (
    <div className="flex w-full flex-col gap-4 px-4 pt-5">
      <div className="mb-4 flex items-center gap-2 border-b pb-4">
        <ScrollText className="h-6 w-6" />
        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight sm:text-3xl">
          Activity Logs
        </h2>
      </div>

      <p className="text-sm text-muted-foreground">
        An audit trail of administrative actions (bans, role changes, source
        deletions).
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No activity recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.actorEmail || log.actorId || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.targetType ? `${log.targetType}: ` : ""}
                    {log.targetId || "—"}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-sm">
                    {log.detail || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
