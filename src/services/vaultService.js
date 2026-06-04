import { tauriVault } from "./tauriBridge.js";

export const vaultService = {
  exists:         ()                         => tauriVault.exists(),
  create:         (password, displayName)    => tauriVault.create(password, displayName),
  unlock:         (password, autoLockSecs)   => tauriVault.unlock(password, autoLockSecs),
  lock:           ()                         => tauriVault.lock(),
  isUnlocked:     ()                         => tauriVault.isUnlocked(),
  getInfo:        ()                         => tauriVault.getInfo(),
  changePassword: (currentPw, newPw)         => tauriVault.changePassword(currentPw, newPw),
};