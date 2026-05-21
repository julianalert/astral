import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import StarField from "@/components/StarField";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <>
      <StarField />
      <div className="app">
        <AppNav userEmail={user.email ?? ""} />
        {children}
      </div>
    </>
  );
}
