export type Page = {
  name: string,
  url: string,
  title: string,
  isActive: boolean,
  scripts: Array<string>,
  data: Record<string, any>,
};
