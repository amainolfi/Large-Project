import type { ReactNode } from "react";

export default function Message({
  kind,
  children
}: {
  kind: "success" | "error" | "info";
  children: ReactNode;
}) {
  return <div className={`message message-${kind}`}>{children}</div>;
}
