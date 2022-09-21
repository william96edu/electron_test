import { app, BrowserWindow, dialog, nativeTheme } from 'electron'
import path from 'path'
import os from 'os'
import { autoUpdater } from 'electron-updater'
// initialize()
// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

export default class AppUpdater {
  constructor () {
    const log = require('electron-log')
    log.transports.file.level = 'debug'
    autoUpdater.logger = log
    autoUpdater.checkForUpdatesAndNotify()
  }

  call (win:BrowserWindow) {
    autoUpdater.autoDownload = false
    autoUpdater.checkForUpdates()

    autoUpdater.on('checking-for-update', () => {
      dialog.showMessageBox(win, { message: 'checking-for-update' })
    })

    autoUpdater.on('error', (err) => {
      dialog.showErrorBox('Error', err.message)
    })

    autoUpdater.on('update-available', (info) => {
      dialog.showMessageBox(win, { message: 'Available', detail: JSON.stringify(info), buttons: ['OK', 'cancel'] })
        .then(() => {
          autoUpdater.downloadUpdate().then(() => {
            dialog.showMessageBox(win, { icon: 'info', message: 'Reastart' })
              .then(() => autoUpdater.quitAndInstall())
          })
        })
    })

    // this.autoUpdater.on('download-progress', (info) => {
    //   mainWindow.webContents.send(Events.UpdateDownloadProgress, Status.Progress, info)
    // })

    // this.autoUpdater.on('update-downloaded', (info) => {
    //   mainWindow.webContents.send(Events.UpdateDownloaded, Status.Downloaded, info)
    // })

    // this.autoUpdater.on('update-not-available', (info) => {
    //   mainWindow.webContents.send(Events.UpdateNotAvailable, Status.NotAvailable, info)
    // })
  }
}

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(
      path.join(app.getPath('userData'), 'DevTools Extensions')
    )
  }
} catch (_) {}

let mainWindow: BrowserWindow | undefined

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1976D2'
    },
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
    }
  })
  // enable(mainWindow.webContents)
  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined
  })

  new AppUpdater().call(mainWindow)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === undefined) {
    createWindow()
  }
})
