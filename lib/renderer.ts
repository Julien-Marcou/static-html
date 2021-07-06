import { Page } from '../types/page';
import { Website } from '../types/website';

export class Renderer {

  private sourceDirectory: string;
  private website: Website;

  constructor(sourceDirectory: string, website: Website) {
    this.sourceDirectory = sourceDirectory;
    this.website = website;
  }

  private async renderPageContent(page: Page): Promise<string> {
    const pagePath = `${this.sourceDirectory}/pages/${page.name}.ts`;
    const {default: renderPage}: {
      default: (data: Record<string, any>, page: Page, website: Website) => Promise<string> | string,
    } = require(pagePath);
    delete require.cache[require.resolve(pagePath)];
    return await Promise.resolve(renderPage(page.data, page, this.website));
  }

  private async renderPageTemplate(page: Page, pageContent: string): Promise<string> {
    const templatePath = `${this.sourceDirectory}/template.ts`;
    const {default: renderTemplate}: {
      default: (content: string, page: Page, website: Website) => Promise<string> | string,
    } = require(templatePath);
    delete require.cache[require.resolve(templatePath)];
    return await Promise.resolve(renderTemplate(pageContent, page, this.website));
  }

  async render(page: Page): Promise<string> {
    page.isActive = true;
    const pageContent = await this.renderPageContent(page);
    const result = await this.renderPageTemplate(page, pageContent);
    page.isActive = false;
    return result;
  }
}
