import { ReactElement } from 'react';

interface EmailTemplateProps {
  firstName: string;
  verificationLink: string;
}

// This is a React component for the email template
// It can be rendered to HTML string using a library like @react-email/render
export default function VerifyEmailTemplate({
  firstName,
  verificationLink,
}: EmailTemplateProps): ReactElement {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify Your Flipstaq Account</title>
      </head>
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
          lineHeight: '1.6',
          color: '#333',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
          backgroundColor: '#f9fafb',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '40px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1
              style={{
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0',
              }}
            >
              🛍️ Flipstaq
            </h1>
          </div>

          <h2>Welcome to Flipstaq, {firstName}!</h2>

          <p>
            Thank you for signing up for Flipstaq, the premier multi-vendor
            eCommerce platform. To complete your registration and start buying
            and selling, please verify your email address.
          </p>

          <div style={{ textAlign: 'center' }}>
            <a
              href={verificationLink}
              style={{
                display: 'inline-block',
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                margin: '20px 0',
              }}
            >
              Verify Email Address
            </a>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p
            style={{
              wordBreak: 'break-all',
              backgroundColor: '#f3f4f6',
              padding: '10px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          >
            {verificationLink}
          </p>

          <div
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '4px',
              padding: '16px',
              margin: '20px 0',
              color: '#92400e',
            }}
          >
            <strong>Security Notice:</strong> This verification link will expire
            in 30 minutes for your security. If you didn't create an account
            with Flipstaq, please ignore this email.
          </div>

          <div
            style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb',
              fontSize: '14px',
              color: '#6b7280',
            }}
          >
            <p>
              Best regards,
              <br />
              The Flipstaq Team
            </p>
            <p>
              If you're having trouble with the verification button, copy and
              paste the link above into your web browser.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
