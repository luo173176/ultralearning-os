import { useEffect, useState } from "react";

import { db } from "./db";

/**
 * 响应式数据查询：初始加载一次 + 数据库任何写入时自动重查。
 * 等价于本地版 Server Component 直读 + revalidatePath 的组合。
 * fn 每次渲染需为稳定引用（组件内用 useCallback），deps 变化时重查。
 */
export function useDbQuery<T>(
  fn: () => Promise<T>,
  deps: readonly unknown[],
  initial: T,
): { data: T; ready: boolean } {
  const [data, setData] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fn().then((r) => {
      if (!alive) return;
      setData(r);
      setReady(true);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const onChange = () => {
      fn().then((r) => setData(r));
    };
    db.on("changes").subscribe(onChange);
    return () => {
      db.on("changes").unsubscribe(onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, ready };
}
