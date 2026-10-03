"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PRINCIPLES } from "@/lib/principles";
import { cn } from "@/lib/utils";
import { toggleChecklistItem } from "@/server/actions/checklist";

type ChecklistItemData = {
  id: string;
  principle: number;
  text: string;
  isDone: boolean;
};

export function ChecklistPanel({
  projectId,
  items,
}: {
  projectId: string;
  items: ChecklistItemData[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = (item: ChecklistItemData, isDone: boolean) =>
    startTransition(async () => {
      await toggleChecklistItem(projectId, item.id, isDone);
      router.refresh();
    });

  return (
    <div className={cn("grid gap-x-6 gap-y-5 sm:grid-cols-2", pending && "opacity-70")}>
      {PRINCIPLES.map((p) => {
        const list = items.filter((i) => i.principle === p.order);
        const done = list.filter((i) => i.isDone).length;
        return (
          <section key={p.key}>
            <header className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-medium">
                #{p.order} {p.zh}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {p.en}
                </span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {done}/{list.length}
              </span>
            </header>
            <ul className="mt-2 space-y-2">
              {list.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`ck-${item.id}`}
                    checked={item.isDone}
                    onCheckedChange={(v) => toggle(item, v === true)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`ck-${item.id}`}
                    className={cn(
                      "cursor-pointer text-sm font-normal leading-snug",
                      item.isDone && "text-muted-foreground line-through",
                    )}
                  >
                    {item.text}
                  </Label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
