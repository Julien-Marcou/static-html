<p align="center">
  <img src="https://raw.githubusercontent.com/Julien-Marcou/static-html/main/logo.png" alt="">
</p>

# Static-Html

[![NPM Package](https://img.shields.io/npm/v/static-html?label=release&color=%23cd2620&logo=npm)](https://www.npmjs.com/package/static-html)
[![GitHub Repository](https://img.shields.io/github/stars/Julien-Marcou/static-html?color=%23f5f5f5&logo=github)](https://github.com/Julien-Marcou/static-html)

![Downloads per Month](https://img.shields.io/npm/dm/static-html)
![Gzip Size](https://img.shields.io/bundlephobia/minzip/static-html?label=gzip%20size)
![Dependencies Status](https://img.shields.io/david/Julien-Marcou/static-html)
![MIT License](https://img.shields.io/npm/l/static-html)

Static-Html is a simple, lightweight and fast static HTML website generator which makes use of [Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) to let you render JavaScript data and expressions into HTML templates.

Static-Html is not a binding engine as it do not keep track of your data or expressions to update portions of your templates dynamically, templates are only render once.

If your looking for a more advanced rendering engine with dynamic data binding, I suggest you take a look at [Lit](https://lit.dev/) on which this project is inspired.

## Install

```shell
npm install static-html
```

## Table of Contents

- [Getting Started](#getting-started)
- [Minimal Project Example](#minimal-project-example)
- [HTML Tag & Syntax Highlighting](#html-tag--syntax-highlighting)
- [Building your Website](#building-your-website)
- [Assets](#assets)
  - [Asset Revisions with Content Hash](#asset-revisions-with-content-hash)
  - [External Assets](#external-assets)
- [Static Data Rendering](#static-data-rendering)
- [Dynamic Data Rendering](#dynamic-data-rendering)
- [Special Variables](#special-variables)
  - [Page URL & Active Page](#page-url--active-page)
  - [Page Scripts](#page-scripts)
- [Development Stack](#development-stack)
- [Deploy to Production](#deploy-to-production)
- [URL Redirections](#url-redirections)

## Getting Started

After installing `static-html`, make sure you are in the root folder of your project, then run this command :

```shell
npx static init
```

It will create the default structure for your project so you are ready to go. 

The `src` folder contains all the source files needed to build your static website.

The `src/website.json` file contains the configurations for your static website and its content must match this interface :

```typescript
{
  // The title of the website
  "title": string,

  // The description of the website
  "description"?: string,

  // The keywords of the website
  "keywords"?: Array<string>,

  // The pages of the website
  "pages"?: Array<{

    // The name of the page (used for the url and the corresponding page's template)
    "name": string,

    // The title of the page
    "title": string,

    // The static data of the page (see the "Static Data Rendering" section)
    "data"?: Record<string, any>,

    // Scripts to attach before the closing </body> (see the "Page Scripts" section)
    "scripts"?: Array<string>,
  }>,
  
  // Assets which need revisions for cache busting (see the "Asset Revisions with Content Hash" section)
  "assetRevisions"?: Array<{
    "key": string,
    "source": string,
    "target": string,
  }>,

  // Assets that are out of the "src" folder (see the "External Assets" section)
  "externalAssets"?: Array<{
    "source": string,
    "target": string,
  }>,
}
```

The `src/template.ts` file contains the common HTML template for all your pages and its content must match this interface :

```typescript
import { Page, Website } from 'static-html';

/**
 * @param content - The rendered content for the current page
 * @param page - The current page configuration & data
 * @param website - The website configuration
 * @return The fully rendered page
 */
export default (content: string, page: Page, website: Website) => string | Promise<string>;
```

The `src/pages` folder contains HTML templates for each of your pages, so that each of them have a `src/pages/{pageName}.ts` file and the corresponding entry inside the `src/website.json`.

Each `src/pages/{pageName}.ts` file content must match this interface :

```typescript
import { Page, Website } from 'static-html';

/**
 * @param data - The data for the current page
 * @param page - The current page configuration & data
 * @param website - The website configuration
 * @return The rendered content for the current page
 */
export default (data: Record<string, any>, page: Page, website: Website) => string | Promise<string>;
```

## Minimal Project Example

Here is the bare minimum configuration that you need in order to create a static website with a single `index` page :

```
📂 my-website/
├── 📂 src/
│   ├── 📂 pages/
│   │   └── 📄 index.ts
│   ├── 📄 template.ts
│   └── 📄 website.json
└── 📄 package.json
```

```jsonc
// src/website.json
{
  "title": "My website",
  "pages": [
    {
      "name": "index",
      "title": "Homepage"
    }
  ]
}
```

```typescript
// src/template.ts
export default (content, page, website) =>

`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${website.title} - ${page.title}</title>
</head>
<body>
  ${content}
</body>`;
```

```typescript
// src/pages/index.ts
export default () =>

`<h1>Welcome to my website</h1>`;
```

## HTML Tag & Syntax Highlighting

Although this is not mandatory, I highly suggest you to prefix all your Template Literals with the `html` tag provided by `static-html`.

[Tagged Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) allow for custom parsing of the given template.

But it's mostly usefull as it will also allow you to enable syntax highlighting and language support for HTML inside of your Template Literals by installing the corresponding extension to your code editor (e.g. `lit-html` for VSCode).

```typescript
export default () =>

`<h1>Welcome to my website</h1>`;
```

Will become : 

```typescript
import { html } from 'static-html';

export default () =>

html`<h1>Welcome to my website</h1>`;
```

The only difference between our `html` tagged template literal and a non-tagged template literal is the parsing of `array` items.

With a non-tagged template literal, items are joined with a comma, while `html` tagged template literal will join them with an empty string.

It's very handy when you have an array of items that you want to render, as you only need to map() each items to the desired HTML output :

```typescript
import { html } from 'static-html';

const items = [1, 2, 3];

export default () => html`
<ul>
  ${items.map(item => html`
    <li>
      Item ${i}
    </li>
  `)}
</ul>`;
```

Will render : 

```html
<ul>
  <li>
    Item 1
  </li>
  <li>
    Item 2
  </li>
  <li>
    Item 3
  </li>
</ul>
```

Instead of : 

```html
<ul>
  <li>
    Item 1
  </li>
  ,
  <li>
    Item 2
  </li>
  ,
  <li>
    Item 3
  </li>
</ul>
```

If for some reason you want the original behavior of non-tagged template literals, and keep syntax highlighting, you can define your own `html` tag using the native `String.raw` tag (identical behavior to non-tagged template literal), instead of using the one defined by `static-html` :

```typescript
const html = String.raw;

export default () => html`<h1>Title</h1>`;
```

## Building your Website

```shell
npx static build
```

Will generate your static website into the `dist` folder :

```
📂 my-website/dist/
└── 📄 index.html
```

```html
<!-- dist/index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My website - Homepage</title>
</head>
<body>
  <h1>Welcome to my website</h1>
</body>
```

## Assets

You can add assets to your website, that will automatically be copied from the `src/assets` folder to the `dist` folder :

```
📂 my-website/src/assets/
├── 📂 css/
│   └── 📄 style.css
├── 📂 img/
│   └── 📄 logo.svg
└── 📄 favicon.ico
```

Will generate :

```
📂 my-website/dist/
├── 📂 css/
│   └── 📄 style.css
├── 📂 img/
│   └── 📄 logo.svg
└── 📄 favicon.ico
```

### Asset Revisions with Content Hash

If you have some assets that frequently change and can end up being cached for too long by browsers (e.g. your `style.css` file), you can generate a `content hash` for these files in order to force browsers to reload them when they have changed :

```jsonc
// src/website.json
{
  // ...
  "assetRevisions": [
    {
      "key": "style", // Will be used in the HTML template to retrieve the generated file
      "source": "/css/style.css", // The file must be located inside the `src/assets` folder
      "target": "/css/style.{contentHash}.css"
    }
  ]
}
```

```
📂 my-website/src/assets/css/
└── 📄 style.css
```

Will generate (keep in mind the hash will change each time the content of the file changes) :

```shell
📂 my-website/dist/css/
└── 📄 style.1454857a471481dc40384d3fb9f2c9b7.css
```

Then in your HTML template, you can retrieve the path to the asset revision like this :

```typescript
// src/template.ts
import { html } from 'static-html';

export default (website, page, content) =>

html`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${website.title} - ${page.title}</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="stylesheet" href="${website.assets.style.url}">
</head>
<body>
  ${content}
</body>`;
```

Wich will give you :

```html
<!-- dist/index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My website - Homepage</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="stylesheet" href="/css/style.1454857a471481dc40384d3fb9f2c9b7.css">
</head>
<body>
  <h1>Welcome to my website</h1>
</body>
```

Keep in mind that only the assets with revision can be accessed through the `website.assets` dictionnary.

### External Assets

In addition to the `src/assets` folder, you can require other assets to be copied to the `dist` folder, from anywhere inside your project's root folder (e.g. if you want to use an asset from a node module) :

```jsonc
// src/website.json
{
  // ...
  "externalAssets": [
    {
      "source": "/node_modules/bootstrap/bootstrap.css", // The file must be located inside your project's root folder
      "target": "/css/bootstrap.css"
    }
  ]
}
```

```
📂 my-website/node_modules/bootstrap/
└── 📄 bootstrap.css
```

Will generate:

```shell
📂 my-website/dist/css/
└── 📄 bootstrap.css
```

## Static Data Rendering

For each pages, you can add `data` that will be made available to your page template :

```jsonc
// src/website.json
{
  // ...
  "pages": [
    {
      "name": "index",
      "title": "Homepage",
      // Will be given as the first arguments of `src/pages/index.ts`
      "data": {
        "defaultColor": "#0f0",
        "colors": [
          {
            "value": "#f00",
            "label": "Red"
          },
          {
            "value": "#0f0",
            "label": "Green"
          },
          {
            "value": "#00f",
            "label": "Blue"
          }
        ]
      }
    }
  ]
}
```

```typescript
// src/pages/index.ts
import { html } from 'static-html';

// Destructuring the data object so it's simpler to use
export default ({defaultColor, colors}) =>

html`<h1>Welcome to my website</h1>

<form>
  <h2>What is your favorite color?</h2>

  ${colors.map(color => html`
    <label>
      ${color.label}
      <input
        type="checkbox"
        value="${color.value}"
        ${color.value === defaultColor ? 'checked' : ''}>
    </label>
  `)}

  <button>Submit</button>
</form>`;
```

Wich will give you :

```html
<!-- dist/index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My website - Homepage</title>
</head>
<body>
  <h1>Welcome to my website</h1>

  <form>
    <h2>What is your favorite color?</h2>

    <label>
      Red
      <input type="checkbox" value="#f00">
    </label>

    <label>
      Green
      <input type="checkbox" value="#0f0" checked>
    </label>

    <label>
      Blue
      <input type="checkbox" value="#00f">
    </label>

    <button>Submit</button>
  </form>
</body>
```

## Dynamic Data Rendering

For each page, if you have data that must be resolved before being renderer (e.g. calling an API), you can create the corresponding `{pageName}.ts` file inside the `src/resolvers` folder.

Each `src/resolvers/{pageName}.ts` file content must match this interface :

```typescript
import { Page } from 'static-html';

/**
 * @param page - The current page configuration & data
 */
export default (page: Page) => void | Promise<void>;
```

Here is a quick example :

```typescript
// src/resolvers/{pageName}.ts

function async getPhotos() {
  // ...
}

export default async (page) => {
  page.data.photos = await getPhotos();
}
```

The page's `data` will then be made available to your page template :

```typescript
// src/pages/{pageName}.ts
import { html } from 'static-html';

export default ({photos}) =>

html`<ul>
  ${photos.map(photo => html`
    <li>
      <img src="${photo.src}" alt="${photo.atl}">
    </li>
  `)}
</ul>`;
```

## Special Variables

Some special variables are available through the `page` & `website` arguments that are given to `src/template.ts` & `src/pages/{pageName}.ts` files.

Some useful variables you may already have seen :

- `website.title`
- `website.description`
- `website.keywords`
- `page.title`

### Page URL & Active Page

If you want to change the content of the template based on which page is currently rendered (e.g. add an `active` class on the menu link corresponding to the current page), you can use :

- `website.pages.{pageName}.url`
- `website.pages.{pageName}.isActive`

Where `{pageName}` is the camel case version of the page's name defined in the `src/website.json`.

Here is a quick example :

```typescript
// src/template.ts
import { html } from 'static-html';

export default (content, page, website) =>

html`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${website.title} - ${page.title}</title>
</head>
<body>
  <nav>
    <ul>
      <li${website.pages.index.isActive ? ' class="active"' : ''}>
        <a href="${website.pages.index.url}">
          Home
        </a>
      </li>
      <li${website.pages.termsOfService.isActive ? ' class="active"' : ''}>
        <a href="${website.pages.termsOfService.url}">
          Terms of Service
        </a>
      </li>
      <li${website.pages.cookiePolicy.isActive ? ' class="active"' : ''}>
        <a href="${website.pages.cookiePolicy.url}">
          Cookie Policy
        </a>
      </li>
    </ul>
  </nav>
  ${content}
</body>`;
```

and :

```jsonc
// src/website.json
{
  "title": "My website",
  "pages": [
    {
      "name": "index",
      "title": "Homepage"
    },
    {
      "name": "terms-of-service",
      "title": "Our Terms of Service" 
    },
    {
      "name": "cookie-policy",
      "title": "Our Cookie Policy" 
    }
  ]
}
```

Will render (for the `index` page) :

```html
<!-- dist/index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My website - Homepage</title>
</head>
<body>
  <nav>
    <ul>
      <li class="active">
        <a href="/">
          Home
        </a>
      </li>
      <li>
        <a href="/terms-of-service">
          Terms of Service
        </a>
      </li>
      <li>
        <a href="/cookie-policy">
          Cookie Policy
        </a>
      </li>
    </ul>
  </nav>
  <h1>Welcome to my website</h1>
</body>`;
```

### Page Scripts

You can include JS `scripts` for a specific page like that :

```jsonc
// src/website.json
{
  // ...
  "pages": [
    {
      "name": "index",
      "title": "Homepage",
      "scripts": [
        // The files must be located inside the `src/assets` folder
        "/js/my-script.js",
        "/js/another-script.js"
      ]
    }
  ]
}
```

```typescript
// src/template.ts
import { html } from 'static-html';

export default (website, page, content) =>

html`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${website.title} - ${page.title}</title>
</head>
<body>
  ${content}
  ${page.scripts}
</body>`;
```

Wich will give you :

```html
<!-- dist/index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My website - Homepage</title>
</head>
<body>
  <h1>Welcome to my website</h1>
  <script src="/js/my-script.js"></script>
  <script src="/js/another-script.js"></script>
</body>
```

## Development Stack

```shell
npx static watch
```

Will automatically rebuild your website when there is a change to any file inside the `src` folder.

```shell
npx static serve
```

Will do the same as the previous command, but it will also create a local server for the `dist` folder at `http://localhost:4200` and will automatically reload your browser after each rebuild.

You can also change the port of local server using the `--port` option :

```shell
npx static serve --port 8080
```

## Deploy to Production

With static websites, you want to rely on the browser's cache system, where the browser will try to keep in memory resources previously requested as long as they have not changed.

Because of that, you don't want to overwrite your production files when they didn't changed (overwriting a file when the content hasn't changed will still change the `last modified` date and may force the browser to clear its cache for this file).

```shell
npx static deploy <production-directory>
```

This command will ask you if you want to continue before automatically deploying the content of the `dist` folder to the `production-directory` folder whitout overwritting files that have not changed.

It will also removed stale files and directories so the content of the `production-directory` folder exactly matches the content of the `dist` folder.

You can also skip all interactions with the prompt using the `--no-interaction` option (e.g. if you use a CRON to regularly deploy your static website) :

```shell
npx static deploy <production-directory> --no-interaction
```

After a sucessful deployement, you can use the following command to clean the `dist` folder (does the same as `rm -rf dist`) as it is not needed anymore :

```shell
npx static clean
```

## URL Redirections

Altough you will need a `.htaccess` on your production server if you don't want the `.html` extension in the URLs, the local developement server will automatically make the index page accessible through the `/` url (i.e. `http://localhost:4200/` instead of `http://localhost:4200/index.html`), and all other pages will be made accessible without the `.html` extension (e.g `http://localhost:4200/page` instead of `http://localhost:4200/page.html`).

The recommended `.htaccess` is :

```apacheconf
# src/assets/.htaccess
RewriteEngine On

# Redirect "/page.html" to "/page" (only if "/page.html" exists)
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{THE_REQUEST} /(.+)\.html [NC]
RewriteRule ^(.+)\.html$ /$1 [NC,R=301,L]

# Redirect "/index" to "/"
RewriteRule ^index$ / [NC,R=301,L]

# Load "/page.html" when requesting "/page" (only if "/page.html" exists)
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI}.html -f
RewriteRule ^ /%{REQUEST_URI}.html [QSA,L]
```
