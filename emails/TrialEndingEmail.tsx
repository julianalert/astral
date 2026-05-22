import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface TrialEndingEmailProps {
  userName: string;
  appUrl: string;
}

export default function TrialEndingEmail({
  userName,
  appUrl,
}: TrialEndingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Seraphova trial ends today, {userName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>✦ SERAPHOVA</Text>
          </Section>

          <Section style={content}>
            <Text style={eyebrow}>Day 3 · Last day of your trial</Text>
            <Heading style={h1}>Your reading is still here.</Heading>

            <Text style={paragraph}>
              Your trial ends today, {userName}. Everything you&apos;ve explored —
              your chart, your conversations, the memories Seraphova has built about
              you — is safe. But the conversation window closes tonight.
            </Text>

            <Text style={paragraph}>
              Continue for less than a coffee a week:
            </Text>

            <Section style={plansRow}>
              <Section style={plan}>
                <Text style={planLabel}>Monthly</Text>
                <Text style={planPrice}>$9<Text style={planPer}>/month</Text></Text>
              </Section>
              <Section style={planFeatured}>
                <Text style={planBadge}>Best value</Text>
                <Text style={planLabel}>Annual</Text>
                <Text style={planPrice}>$59<Text style={planPer}>/year</Text></Text>
                <Text style={planSub}>$4.90/month</Text>
              </Section>
            </Section>

            <Section style={btnSection}>
              <Button href={`${appUrl}/upgrade`} style={btn}>
                Continue my reading →
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={features}>What you keep with a subscription:</Text>
            <Text style={feature}>✦ Unlimited AI chat with your natal chart</Text>
            <Text style={feature}>✦ Daily personalized transit briefing</Text>
            <Text style={feature}>✦ Full conversation history &amp; memory layer</Text>
            <Text style={feature}>✦ Up to 3 relationship compatibility profiles</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because your Seraphova trial is ending.{" "}
              <a href={`${appUrl}/settings`} style={footerLink}>
                Manage preferences
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#07080a",
  fontFamily: "'Georgia', serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "32px",
};

const logo: React.CSSProperties = {
  color: "#c9a96e",
  fontSize: "16px",
  letterSpacing: "4px",
  margin: "0",
};

const content: React.CSSProperties = {
  backgroundColor: "#0f1117",
  border: "1px solid #1e2130",
  borderRadius: "12px",
  padding: "40px",
};

const eyebrow: React.CSSProperties = {
  color: "#9ba3b5",
  fontSize: "11px",
  letterSpacing: "3px",
  textTransform: "uppercase" as const,
  margin: "0 0 12px",
};

const h1: React.CSSProperties = {
  color: "#f0ece4",
  fontSize: "26px",
  fontWeight: "normal",
  letterSpacing: "0.5px",
  margin: "0 0 24px",
};

const paragraph: React.CSSProperties = {
  color: "#9ba3b5",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const plansRow: React.CSSProperties = {
  display: "flex" as const,
  gap: "12px",
  margin: "24px 0",
};

const plan: React.CSSProperties = {
  flex: "1",
  backgroundColor: "#0a0c14",
  border: "1px solid #1e2130",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center",
};

const planFeatured: React.CSSProperties = {
  flex: "1",
  backgroundColor: "#0a0c14",
  border: "1px solid #c9a96e",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center",
  position: "relative" as const,
};

const planBadge: React.CSSProperties = {
  color: "#c9a96e",
  fontSize: "10px",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const planLabel: React.CSSProperties = {
  color: "#9ba3b5",
  fontSize: "12px",
  margin: "0 0 4px",
};

const planPrice: React.CSSProperties = {
  color: "#f0ece4",
  fontSize: "22px",
  margin: "0",
};

const planPer: React.CSSProperties = {
  color: "#5a6270",
  fontSize: "13px",
};

const planSub: React.CSSProperties = {
  color: "#5a6270",
  fontSize: "11px",
  margin: "4px 0 0",
};

const btnSection: React.CSSProperties = {
  textAlign: "center",
  margin: "32px 0",
};

const btn: React.CSSProperties = {
  backgroundColor: "#c9a96e",
  color: "#07080a",
  padding: "14px 32px",
  borderRadius: "6px",
  fontSize: "14px",
  letterSpacing: "1px",
  textDecoration: "none",
  display: "inline-block",
};

const hr: React.CSSProperties = {
  borderColor: "#1e2130",
  margin: "24px 0",
};

const features: React.CSSProperties = {
  color: "#5a6270",
  fontSize: "12px",
  margin: "0 0 8px",
};

const feature: React.CSSProperties = {
  color: "#9ba3b5",
  fontSize: "13px",
  lineHeight: "1.8",
  margin: "0 0 4px",
};

const footer: React.CSSProperties = {
  marginTop: "24px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  color: "#3a4050",
  fontSize: "12px",
};

const footerLink: React.CSSProperties = {
  color: "#5a6270",
};
