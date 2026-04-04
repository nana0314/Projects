import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getPet: () => ipcRenderer.invoke('get-pet'),
  feedPet: () => ipcRenderer.invoke('feed-pet'),
  playWithPet: () => ipcRenderer.invoke('play-with-pet'),
  petThePet: () => ipcRenderer.invoke('pet-the-pet'),
  renamePet: (name: string) => ipcRenderer.invoke('rename-pet', name),
  setAnimal: (type: string) => ipcRenderer.invoke('set-animal', type),
  getTodayStats: () => ipcRenderer.invoke('get-today-stats'),
  getAllStats: () => ipcRenderer.invoke('get-all-stats'),
  addJobApplication: () => ipcRenderer.invoke('add-job-application'),
  addWorkLog: (entry: { category: string; description: string; minutes: number }) =>
    ipcRenderer.invoke('add-work-log', entry),
  getWorkLog: () => ipcRenderer.invoke('get-work-log'),
  getTrackedRepos: () => ipcRenderer.invoke('get-tracked-repos'),
  refreshGit: () => ipcRenderer.invoke('refresh-git'),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  onStatsUpdate: (cb: (stats: unknown) => void) => {
    ipcRenderer.on('stats-update', (_e, stats) => cb(stats))
    return () => ipcRenderer.removeAllListeners('stats-update')
  },
  onPetUpdate: (cb: (pet: unknown) => void) => {
    ipcRenderer.on('pet-update', (_e, pet) => cb(pet))
    return () => ipcRenderer.removeAllListeners('pet-update')
  }
})
