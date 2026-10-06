import { register } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Create an account</h1>
      <AuthForm
        action={register}
        submitLabel="Register"
        fields={[
          { name: "display_name", label: "Display name", type: "text", autoComplete: "nickname" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
          { name: "confirm_password", label: "Confirm password", type: "password", autoComplete: "new-password" },
        ]}
        footer={{ text: "Already have an account?", href: "/login", linkLabel: "Log in" }}
      />
    </main>
  );
}
