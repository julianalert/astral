import { Resend } from "resend";
import { render } from "@react-email/components";
import WelcomeEmail from "@/emails/WelcomeEmail";
import EngagementEmail from "@/emails/EngagementEmail";
import TrialEndingEmail from "@/emails/TrialEndingEmail";
import DailyBriefingEmail from "@/emails/DailyBriefingEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Astral <hello@astralapp.co>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://astralapp.co";

export async function sendWelcomeEmail({
  to,
  userName,
  sunSign,
}: {
  to: string;
  userName: string;
  sunSign: string;
}) {
  const html = await render(
    WelcomeEmail({ userName, sunSign, appUrl: APP_URL })
  );

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your natal chart is ready ✦`,
    html,
  });
}

export async function sendEngagementEmail({
  to,
  userName,
  transitSnippet,
}: {
  to: string;
  userName: string;
  transitSnippet: string;
}) {
  const html = await render(
    EngagementEmail({ userName, transitSnippet, appUrl: APP_URL })
  );

  return resend.emails.send({
    from: FROM,
    to,
    subject: `What's active in your chart today`,
    html,
  });
}

export async function sendTrialEndingEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}) {
  const html = await render(TrialEndingEmail({ userName, appUrl: APP_URL }));

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your Astral trial ends today`,
    html,
  });
}

export async function sendDailyBriefingEmail({
  to,
  userName,
  briefingContent,
}: {
  to: string;
  userName: string;
  briefingContent: string;
}) {
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const html = await render(
    DailyBriefingEmail({ userName, briefingContent, dateLabel, appUrl: APP_URL })
  );

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your sky report for ${dateLabel}`,
    html,
  });
}
