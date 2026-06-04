import { tauriSettings } from "./tauriBridge.js";

export const settingsService = {
  get:    ()         => tauriSettings.get(),
  update: (settings) => tauriSettings.update(settings),
  reset:  ()         => tauriSettings.reset(),
};