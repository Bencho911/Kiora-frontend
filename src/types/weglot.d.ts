export {};

declare global {
  interface Window {
    Weglot?: {
      initialize: (options: { api_key: string }) => void;
    };
  }
}
