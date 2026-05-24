import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("relationship_profiles")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Find the scoped conversation for this relationship
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title")
    .eq("user_id", user.id)
    .eq("relationship_profile_id", params.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const report = (profile.chart_data as { compatibility_report?: string })?.compatibility_report ?? null;

  return NextResponse.json({ profile, report, conversationId: conversation?.id ?? null });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("relationship_profiles")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
