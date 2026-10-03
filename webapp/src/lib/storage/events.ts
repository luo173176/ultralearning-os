// 存储层变更广播：所有写操作完成后调用 notifyDataChanged()，
// useDbQuery 订阅它实现页面自动刷新（原生 Dexie 没有 changes 事件，不能依赖 db.on）。

type Listener = () => void;

const listeners = new Set<Listener>();

export function notifyDataChanged(): void {
  for (const l of listeners) l();
}

export function subscribeDataChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
