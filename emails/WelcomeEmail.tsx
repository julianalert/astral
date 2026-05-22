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

interface WelcomeEmailProps {
  userName: string;
  sunSign: string;
  appUrl: string;
}

export default function WelcomeEmail({
  userName,
  sunSign,
  appUrl,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your natal chart is ready, {userName} ✦</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>✦ SERAPHOVA</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Your chart is alive.</Heading>
            <Text style={paragraph}>
              Welcome, {userName}. Your natal chart has been computed and your AI
              astrology companion is ready to know you — not just your Sun in{" "}
              {sunSign}, but every placement, every tension, every gift in your
              chart.
            </Text>
            <Text style={paragraph}>
              This isn't a horoscope. Every response is grounded in your unique
              chart and what's active in the sky <em>for you</em>, right now.
            </Text>
            <Text style={paragraph}>
              Your 3-day trial starts today. Ask it anything.
            </Text>

            <Section style={btnSection}>
              <Button href={`${appUrl}/chat`} style={btn}>
                Open my reading →
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={hint}>
              Some things to explore in your first session:
            </Text>
            <Text style={hint}>
              · What does my chart say about my current path?
            </Text>
            <Text style={hint}>
              · What transits are most active for me right now?
            </Text>
            <Text style={hint}>
              · What patterns keep showing up in my life?
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you signed up for Seraphova.{" "}
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
  fontFamily: "'Georgia', serif",
  margin: "0",
};

const content: React.CSSProperties = {
  backgroundColor: "#0f1117",
  border: "1px solid #1e2130",
  borderRadius: "12px",
  padding: "40px",
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

const hint: React.CSSProperties = {
  color: "#5a6270",
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
