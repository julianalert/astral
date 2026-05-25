"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  initMixpanel,
  identifyUser,
  resetMixpanel,
  trackSignUpCompleted,
  isRecentSignUp,
} from "@/lib/mixpanel";

export default function MixpanelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initMixpanel();
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        identifyUser(session.user.id, { email: session.user.email });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        identifyUser(session.user.id, { email: session.user.email });

        const provider = session.user.app_metadata?.provider;
        if (provider === "google" && isRecentSignUp(session.user.created_at)) {
          trackSignUpCompleted(session.user.id, "google");
        }
      } else if (event === "SIGNED_OUT") {
        resetMixpanel();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
