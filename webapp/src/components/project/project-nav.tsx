"use client";

import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "", label: "仪表盘", ready: true },
  { href: "/map", label: "学习地图", ready: true },
  { href: "/focus", label: "学习会话", ready: true },
  { href: "/retrieval", label: "检索", ready: true },
  { href: "/direct", label: "直接练习", ready: true },
  { href: "/drill", label: "钻练", ready: true },
  { href: "/settings", label: "数据与导出", ready: true },
] as const;

export function ProjectNav({ projectId }: { projectId: string }) {
  const { pathname } = useLocation();
  const base = `/projects/${projectId}`;

  return (
    <nav
      aria-label="项目导航"
      className="flex flex-row gap-1 overflow-x-auto md:flex-col"
    >
      {ITEMS.map((item) => {
        const href = `${base}${item.href}`;
        const active =
          pathname === href || (item.href !== "" && pathname.startsWith(href));
        return (
          <Link
            key={item.label}
            to={href}
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
