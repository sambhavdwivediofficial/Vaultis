import { tauriPasswords } from "./tauriBridge.js";

export const passwordService = {
  list:   ()       => tauriPasswords.list(),
  get:    (id)     => tauriPasswords.get(id),
  search: (query)  => tauriPasswords.search(query),
  delete: (id)     => tauriPasswords.delete(id),
  restore:(id)     => tauriPasswords.restore(id),

  create: (data) => tauriPasswords.create(
    data.name, data.username, data.password, data.url,
    data.notes, data.totpSecret, data.tags, data.folderId, data.isFavorite
  ),

  update: (id, data) => tauriPasswords.update(
    id, data.name, data.username, data.password, data.url,
    data.notes, data.totpSecret, data.tags, data.folderId, data.isFavorite
  ),

  generate: (opts) => tauriPasswords.generate(
    opts.length, opts.uppercase, opts.lowercase,
    opts.digits, opts.symbols, opts.excludeAmbiguous
  ),
};