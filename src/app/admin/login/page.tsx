import { Suspense } from "react";
import { AdminLoginClient } from "./AdminLoginClient";

export default function Page() {
  const configured = Boolean(process.env.ADMIN_PASSWORD);
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-md px-4 py-14 sm:px-6" />}>
      <AdminLoginClient configured={configured} />
    </Suspense>
  );
}
