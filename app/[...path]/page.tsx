import EnterpriseWorkspace from "../enterprise-workspace";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense fallback={<div className="loading">Opening your workspace…</div>}>
      <EnterpriseWorkspace />
    </Suspense>
  );
}
