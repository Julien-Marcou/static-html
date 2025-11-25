import { watch } from 'chokidar';
import express, { Application, Request, Response } from 'express';
import { existsSync, readFileSync } from 'fs';

const livereloadScript = `
  <script type="text/javascript">
    let reloadOnInit = false;
    function initLiveReload() {
      const liveReload = new EventSource('/livereload');
      liveReload.addEventListener('message', (event) => {
        if (event.data === 'reload' || event.data === 'init' && reloadOnInit) {
          reloadOnInit = false;
          // liveReload.close();
          window.location.reload();
        }
      });
      liveReload.addEventListener('error', () => {
        reloadOnInit = true;
        liveReload.close();
        document.body.style.display = 'grid';
        document.body.style.alignContent = 'center';
        document.body.style.justifyContent = 'center';
        document.body.style.textAlign = 'center';
        document.body.style.height = '100%';
        document.body.style.fontFamily = 'sans-serif';
        document.body.style.backgroundColor = '#999';
        document.body.style.color = '#fff';
        document.body.style.fontSize = '30px';
        document.body.textContent = 'Live Reload connection lost...';
        setTimeout(() => {
          initLiveReload();
        }, 2000);
      });
      window.addEventListener('beforeunload', () => {
        liveReload.close();
      });
    }
    initLiveReload();
  </script>`;

const resourceNotFoundPage = `
  <html>
  <head>
    <title>404 Not Found</title>
  </head>
  <body>
    404 Not Found
    ${livereloadScript}
  </body>`;

export class Server {

  private directoryToServe: string;
  private port: number;
  private liveReloadClients: Array<Response>;
  private app: Application;

  constructor(directoryToServe: string, port: number) {
    this.directoryToServe = directoryToServe;
    this.port = port;
    this.liveReloadClients = [];
    this.app = express();
  }

  private handleLiveReloadClient(req: Request, res: Response): void {
    this.liveReloadClients.push(res);
    req.on('close', () => {
      this.liveReloadClients.splice(this.liveReloadClients.indexOf(res), 1);
    });
  }

  private serveLiveReloadEndpoint(res: Response): void {
    res.writeHead(200, {
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
    });
    res.write('data: init\n\n');
  }

  private serveStaticFileEndpoint(requestedResource: string, res: Response): void {
    // Send HTML file with LiveReload script
    if (requestedResource.endsWith('.html')) {
      const html = readFileSync(requestedResource).toString().replace('</body>', `${livereloadScript}</body>`);
      res.setHeader('Content-type','text/html');
      res.send(html);
    }
    // Send any file
    else {
      res.sendFile(requestedResource);
    }
  }

  private serve404Endpoint(res: Response): void {
    res.status(404);
    res.setHeader('Content-type','text/html');
    res.send(resourceNotFoundPage);
  }

  private getRequestResource(req: Request): string {
    // Redirect / to /index.html
    let requestedResource: string;
    if (req.path === '/') {
      requestedResource = `${this.directoryToServe}/index.html`;
    }
    else {
      requestedResource = `${this.directoryToServe}${req.path}`;
    }

    // Redirect /page to /page.html if /page.html exists
    const requestedHtmlResource = `${requestedResource}.html`;
    if (!existsSync(requestedResource) && existsSync(requestedHtmlResource)) {
      requestedResource = requestedHtmlResource;
    }

    return requestedResource;
  }

  private reloadClients(): void {
    this.liveReloadClients.forEach((liveReloadClient) => {
      liveReloadClient.write('data: reload\n\n');
    });
  }

  private watchServer(): void {
    // Watch parent directory as chokidar cannot track changes anymore if the watched folder is being deleted then recreated
    // (which happens every time we rebuild the project)
    const serverWatcher = watch(`${this.directoryToServe}/..`, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 600,
        pollInterval: 200,
      },
    });
    serverWatcher.on('all', (event, file) => {
      if (file.startsWith(this.directoryToServe)) {
        this.reloadClients();
      }
    });
  }

  async serve(): Promise<void> {
    // Automatically reload client when files change on the server
    this.watchServer();

    this.app.get('/*', (req, res) => {
      // LiveReload endpoint
      if (req.originalUrl === '/livereload') {
        this.handleLiveReloadClient(req, res);
        this.serveLiveReloadEndpoint(res);
        return;
      }

      // Static file endpoint
      const requestedResource = this.getRequestResource(req);
      if (existsSync(requestedResource)) {
        this.serveStaticFileEndpoint(requestedResource, res);
        return;
      }

      // 404 endpoint
      this.serve404Endpoint(res);
    });

    // Start server
    await new Promise<void>((resolve) => {
      this.app.listen(this.port, () => {
        resolve();
      });
    });
    process.stdout.write(`Server running at http://localhost:${ this.port }\n`);
  }
}


