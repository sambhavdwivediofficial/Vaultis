import { tauriBackup } from "./tauriBridge.js";

export const backupService = {
  list:    ()           => tauriBackup.list(),
  create:  ()           => tauriBackup.create(),
  delete:  (backupPath) => tauriBackup.delete(backupPath),
  restore: (backupPath) => tauriBackup.restore(backupPath),
  export:  (destDir)    => tauriBackup.export(destDir),
};