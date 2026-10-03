import { Badge } from "@/components/ui/badge";
import {
  PROJECT_STATUS_META,
  type ProjectStatus,
} from "@/lib/domain";

export function ProjectStatusBadge({ status }: { status: string }) {
  const meta =
    PROJECT_STATUS_META[status as ProjectStatus] ??
    ({ label: status, badge: "outline" } as const);
  return <Badge variant={meta.badge}>{meta.label}</Badge>;
}
