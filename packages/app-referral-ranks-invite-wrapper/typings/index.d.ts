declare function templateBuilder(value: { [key: string]: string }): string;
declare module '*.handlebars' {
  export = templateBuilder;
}
