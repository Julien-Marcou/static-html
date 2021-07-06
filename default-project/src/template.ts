import { html, Page, Website } from 'static-html';

export default (content: string, page: Page, website: Website) =>

html`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${website.title} - ${page.title}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <h1>Welcome to your static website</h1>
  </header>
  <main>
    ${content}
  </main>
</body>
</html>
`;
