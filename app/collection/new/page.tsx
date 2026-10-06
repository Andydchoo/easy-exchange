import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { AddCdForm } from "./add-cd-form";

async function AuthenticatedAddCdForm() {
  await requireUser();
  return <AddCdForm />;
}

export default function NewCdPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Add a CD</h1>
      <Suspense>
        <AuthenticatedAddCdForm />
      </Suspense>
    </main>
  );
}
