import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface DailyBriefingEmailProps {
  userName: string;
  briefingContent: string;
  dateLabel: string; // e.g. "Thursday, May 22"
  appUrl: string;
}

// Truncate at a word boundary, max ~180 chars, append ellipsis
function teaser(text: string, max = 180): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "");
  return cut + "…";
}

export default function DailyBriefingEmail({
  userName,
  briefingContent,
  dateLabel,
  appUrl,
}: DailyBriefingEmailProps) {
  const preview = teaser(briefingContent);

  return (
    <Html>
      <Head />
      <Preview>Your sky report for {dateLabel}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>✦ ASTRAL</Text>
          </Section>

          <Section style={content}>
            <Text style={eyebrow}>{dateLabel} · Daily briefing</Text>
            <Heading style={h1}>Your sky report, {userName}.</Heading>

            <Section style={briefingBox}>
              <Text style={briefingText}>{preview}</Text>
            </Section>

            <Section style={btnSection}>
              <Button href={`${appUrl}/briefing`} style={btn}>
                Read your full report →
              </Button>
            </Section>

            <Text style={hint}>
              Your complete sky report is waiting — including what to do with today&apos;s energy.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Daily briefing · Personalized to your natal chart.{" "}
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
  color: "#c9a96e",
  fontSize: "11px",
  letterSpacing: "3px",
  textTransform: "uppercase" as const,
  margin: "0 0 12px",
};

const h1: React.CSSProperties = {
  color: "#f0ece4",
  fontSize: "22px",
  fontWeight: "normal",
  letterSpacing: "0.5px",
  margin: "0 0 28px",
};

const briefingBox: React.CSSProperties = {
  backgroundColor: "#0a0c14",
  border: "1px solid #1e2130",
  borderRadius: "8px",
  padding: "24px",
  margin: "0 0 28px",
};

const briefingText: React.CSSProperties = {
  color: "#c9c4b8",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0",
  fontStyle: "italic",
};

const btnSection: React.CSSProperties = {
  textAlign: "center",
  margin: "0 0 24px",
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

const hint: React.CSSProperties = {
  color: "#5a6270",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
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
