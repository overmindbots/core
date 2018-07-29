declare function localtunnel(
  port: string,
  callback: (err: Error, tunnel: { url: string }) => any
): void;
declare module 'localtunnel' {
  export = localtunnel;
}
