import { Suspense } from "react";
import { login } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";

const errorMessages: Record<string, string> = {
  confirmation_failed: "Email confirmation failed. The link may have expired.",
};

async function LoginForm({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { error } = await searchParams;
  const initialError =
    typeof error === "string" ? errorMessages[error] : undefined;

  return (
    <AuthForm
      action={login}
      submitLabel="Log in"
      initialError={initialError}
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ]}
      footer={{ text: "No account yet?", href: "/register", linkLabel: "Register" }}
    />
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      <Suspense>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
