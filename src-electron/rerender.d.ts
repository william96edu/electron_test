export interface IElectronAPI {
  minimize: () => void,
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
