import * as crypto from 'crypto';
import * as fs from 'fs';
import { Page } from '../types/page';
import { Website } from '../types/website';
import { Renderer } from './renderer';

export type WebsiteConfig = {
  title: string,
  description?: string,
  keywords?: Array<string>,
  pages?: Array<PageConfig>,
  assetRevisions?: Array<{
    key: string,
    source: string,
    target: string,
  }>,
  externalAssets?: Array<{
    source: string,
    target: string,
  }>,
};

export type PageConfig = {
  name: string,
  title: string,
  scripts?: Array<string>,
  data?: Record<string, any>,
};

export class Builder {

  private sourceDirectory: string;
  private targetDirectory: string;
  private assetRevisions: Record<string, string>;
  private externalAssets: Array<{
    source: string,
    target: string,
  }>;
  private website: Website;
  private renderer: Renderer;

  constructor(sourceDirectory: string, targetDirectory: string) {
    this.sourceDirectory = sourceDirectory;
    this.targetDirectory = targetDirectory;
    const websiteConfig = JSON.parse(fs.readFileSync(`${sourceDirectory}/website.json`).toString()) as WebsiteConfig;
    this.assetRevisions = {};
    this.externalAssets = websiteConfig.externalAssets ?? [];
    this.website = {
      title: websiteConfig.title,
      description: websiteConfig.description ?? '',
      keywords: websiteConfig.keywords ?? [],
      pages: websiteConfig.pages?.reduce<Record<string, Page>>((pages, page) => {
        pages[this.hyphensToCamelCase(page.name)] = {
          name: page.name,
          title: page.title,
          url: page.name === 'index' ? '/' : `/${page.name}`,
          isActive: false,
          scripts: page.scripts?.map((script) => {
            return `<script src="${script}"></script>`;
          }) ?? [],
          data: page.data ?? {},
        };
        return pages;
      }, {}) ?? {},
      assets: websiteConfig.assetRevisions?.reduce<Record<string, {url: string, contentHash: string}>>((hashes, asset) => {
        const sourcePath = `${this.sourceDirectory}/assets${asset.source}`;
        const contentHash = this.getFileContentHash(sourcePath);
        const targetUrl = asset.target.replace('{contentHash}', contentHash);
        const targetPath = `${this.targetDirectory}${targetUrl}`;
        this.assetRevisions[sourcePath] = targetPath;
        hashes[asset.key] = {
          url: targetUrl,
          contentHash: contentHash,
        };
        return hashes;
      }, {}) ?? {},
    };
    this.renderer = new Renderer(this.sourceDirectory, this.website);
  }

  private hyphensToCamelCase(words: string): string {
    return words.split('-').map((word, wordPosition) => {
      if (wordPosition === 0) {
        return word;
      }
      const [firstLetter, ...rest] = word;
      return firstLetter.toUpperCase() + rest.join('');
    }).join('');
  }

  private getFileContentHash(filePath: string): string {
    return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex')
  }

  private copyDirectory(sourceDirectory: string, targetDirectory: string): void {
    fs.readdirSync(sourceDirectory).forEach((file) => {
      const sourceFile = `${sourceDirectory}/${file}`;
      const targetFile = `${targetDirectory}/${file}`;
      if (fs.statSync(sourceFile).isDirectory()) {
        if (!fs.existsSync(targetFile)) {
          fs.mkdirSync(targetFile);
        }
        this.copyDirectory(sourceFile, targetFile);
      }
      else {
        if (sourceFile in this.assetRevisions) {
          fs.copyFileSync(sourceFile, this.assetRevisions[sourceFile]);
        }
        else {
          fs.copyFileSync(sourceFile, targetFile);
        }
      }
    });
  }

  private cleanPreviousBuild(): void {
    fs.rmSync(this.targetDirectory, {recursive: true, force: true});
    fs.mkdirSync(this.targetDirectory);
  }

  private buildAssets(): void {
    // Assets directory
    this.copyDirectory(`${this.sourceDirectory}/assets`, this.targetDirectory);

    // External assets
    this.externalAssets.forEach((externalAsset) => {
      fs.copyFileSync(`${__dirname}${externalAsset.source}`, `${this.targetDirectory}${externalAsset.target}`);
    });
  }

  private async buildPage(page: Page): Promise<void> {
    // Retrieve page data
    const resolverPath = `${this.sourceDirectory}/resolvers/${page.name}.ts`;
    if (fs.existsSync(resolverPath)) {
      const {
        default: resolvePage}: {default: (page: Page) => Promise<void> | void,
      } = require(resolverPath);
      delete require.cache[require.resolve(resolverPath)];
      await Promise.resolve(resolvePage(page));
    }

    // Render HTML page
    const htmlResult = await this.renderer.render(page);

    // Write result file
    fs.writeFileSync(`${this.targetDirectory}/${page.name}.html`, htmlResult);
  }

  async build(): Promise<void> {
    process.stdout.write('Building...');
    if (!process.stdout.isTTY) {
      process.stdout.write('\n');
    }
    this.cleanPreviousBuild();
    this.buildAssets();
    for (const page of Object.values(this.website.pages)) {
      await this.buildPage(page);
    }
    if (process.stdout.isTTY) {
      process.stdout.clearLine(-1);
      process.stdout.cursorTo(0);
    }
    process.stdout.write('Build successful\n');
  }
}
