import { zhCN, type MessageKey } from "@/messages/zh-CN";

// 轻量 i18n：文案统一收在 messages/<locale>.ts，v0.3 新增 en 包即可，无需重构。
// 约定：UI 文案禁止散落硬编码，一律通过 t() 取 key；领域数据（如原则内容）先随 zh-CN。

const dictionaries: Record<string, Partial<Record<MessageKey, string>>> = {
  "zh-CN": zhCN,
};

export const DEFAULT_LOCALE = "zh-CN" as const;
export type Locale = keyof typeof dictionaries;

export function t(key: MessageKey, locale: Locale = DEFAULT_LOCALE): string {
  return dictionaries[locale]?.[key] ?? zhCN[key];
}
