import { Page } from './page';

export type Website = {
  title: string,
  description: string,
  keywords: Array<string>,
  pages: Record<string, Page>,
  assets: Record<string, {
    url: string,
    contentHash: string,
  }>;
};
