// Server Actions 的统一返回结构：表单类操作返回可序列化结果，由客户端提示错误。
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "输入不合法";
}
