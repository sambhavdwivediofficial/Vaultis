import { tauriFiles } from "./tauriBridge.js";

export const fileService = {
  list:    ()                      => tauriFiles.list(),
  getMeta: (id)                    => tauriFiles.getMeta(id),
  search:  (query)                 => tauriFiles.search(query),
  delete:  (id)                    => tauriFiles.delete(id),
  restore: (id)                    => tauriFiles.restore(id),

  upload: (sourcePath, tags = [], folderId = null) =>
    tauriFiles.upload(sourcePath, tags, folderId),

  export: (id, exportDir) =>
    tauriFiles.export(id, exportDir),
};