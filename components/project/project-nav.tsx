"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "", label: "概览", ready: true },
  { href: "/map", label: "学习地图", ready: true },
  { href: "/focus", label: "学习会话", ready: true },
  { href: "/retrieval", label: "检索", ready: false, stage: "阶段 3" },
  { href: "/direct", label: "直接练习", ready: false, stage: "阶段 4" },
  { href: "/drill", label: "钻练", ready: false, stage: "阶段 4" },
  { href: "/dashboard", label: "九原则仪表盘", ready: false, stage: "阶段 5" },
] as const;

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav
      aria-label="项目导航"
      className="flex flex-row gap-1 overflow-x-auto md:flex-col"
    >
      {ITEMS.map((item) => {
        const href = `${base}${item.href}`;
        if (!item.ready) {
          return (
            <span
              key={item.label}
              className="flex shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground/50 md:shrink"
            >
              {item.label}
              <span className="text-[10px]">{item.stage}</span>
            </span>
          );
        }
        const active =
          pathname === href || (item.href !== "" && pathname.startsWith(href));
        return (
          <Link
            key={item.label}
            href={href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm transition-colors md:shrink",
              active
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
