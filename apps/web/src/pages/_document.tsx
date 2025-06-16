import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link
          rel="icon"
          href="/favicon-16x16.svg"
          sizes="16x16"
          type="image/svg+xml"
        />
        <link
          rel="icon"
          href="/favicon.svg"
          sizes="32x32"
          type="image/svg+xml"
        />
        <meta name="theme-color" content="#3B82F6" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
