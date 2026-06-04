/**
 * Validate master password requirements.
 */
export function validateMasterPassword(password) {
  const errors = [];
  if (!password) {
    errors.push("Password is required");
    return errors;
  }
  if (password.length < 8)  errors.push("At least 8 characters");
  if (password.length > 512) errors.push("Max 512 characters");
  return errors;
}

/**
 * Validate vault display name.
 */
export function validateVaultName(name) {
  const errors = [];
  if (!name?.trim())     errors.push("Vault name is required");
  if (name?.length > 50) errors.push("Max 50 characters");
  if (/[<>:"\/\\|?*]/.test(name)) errors.push("Invalid characters");
  return errors;
}

/**
 * Validate URL format.
 */
export function validateUrl(url) {
  if (!url) return [];
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) {
      return ["Only http:// and https:// URLs are allowed"];
    }
    return [];
  } catch {
    return ["Invalid URL format"];
  }
}

/**
 * Validate a note title.
 */
export function validateNoteTitle(title) {
  const errors = [];
  if (!title?.trim()) errors.push("Title is required");
  if (title?.length > 200) errors.push("Max 200 characters");
  return errors;
}

/**
 * Validate a password entry name.
 */
export function validateEntryName(name) {
  const errors = [];
  if (!name?.trim()) errors.push("Name is required");
  if (name?.length > 100) errors.push("Max 100 characters");
  return errors;
}

/**
 * Validate username / email field.
 */
export function validateUsername(username) {
  if (!username) return [];
  if (username.length > 200) return ["Max 200 characters"];
  return [];
}

/**
 * Check two passwords match.
 */
export function validatePasswordMatch(pw, confirm) {
  if (!confirm)    return ["Please confirm your password"];
  if (pw !== confirm) return ["Passwords do not match"];
  return [];
}

/**
 * Validate tag string.
 */
export function validateTag(tag) {
  const errors = [];
  if (!tag?.trim())    errors.push("Tag cannot be empty");
  if (tag?.length > 50) errors.push("Max 50 characters");
  if (/[,;]/.test(tag)) errors.push("Commas and semicolons not allowed");
  return errors;
}

/**
 * Collect all errors from multiple validators into one flat array.
 * @param {...string[]} results - arrays returned by validators
 */
export function collectErrors(...results) {
  return results.flat().filter(Boolean);
}

/**
 * Returns first error or null.
 */
export function firstError(...results) {
  const all = collectErrors(...results);
  return all.length > 0 ? all[0] : null;
}