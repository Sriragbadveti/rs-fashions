/// <reference types="vite/client" />

declare module "@tauri-apps/plugin-opener" {
  export function openUrl(url: string): Promise<void>;
}
