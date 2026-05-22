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

interface EngagementEmailProps {
  userName: string;
  transitSnippet: string; // e.g. "Saturn is squaring your natal Moon — a period of emotional restructuring"
  appUrl: string;
}

export default function EngagementEmail({
  userName,
  transitSnippet,
  appUrl,
}: EngagementEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>What&apos;s active in your chart today, {userName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>✦ SERAPHOVA</Text>
          </Section>

          <Section style={content}>
            <Text style={eyebrow}>Day 2 · Your chart, right now</Text>
            <Heading style={h1}>The sky is speaking to your chart today.</Heading>

            <Section style={highlightBox}>
              <Text style={highlightText}>{transitSnippet}</Text>
            </Section>

            <Text style={paragraph}>
              This is exactly the kind of context your AI companion works with —
              not generic horoscope energy, but what&apos;s active in your specific
              placements, mapped to your life.
            </Text>
            <Text style={paragraph}>
              Come back and ask it what this means for what you&apos;re going through
              right now. You might be surprised how precise it can be.
            </Text>

            <Section style={btnSection}>
              <Button href={`${appUrl}/chat`} style={btn}>
                Explore today&apos;s reading →
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this as part of your Seraphova trial.{" "}
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
  margin: "0 0 24px",
};

const highlightBox: React.CSSProperties = {
  backgroundColor: "#0a0c14",
  border: "1px solid #c9a96e33",
  borderLeft: "2px solid #c9a96e",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const highlightText: React.CSSProperties = {
  color: "#c9a96e",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
  fontStyle: "italic",
};

const paragraph: React.CSSProperties = {
  color: "#9ba3b5",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const btnSection: React.CSSProperties = {
  textAlign: "center",
  margin: "32px 0 0",
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
