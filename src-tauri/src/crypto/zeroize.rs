use zeroize::Zeroize;

/// Wipe a mutable byte slice by overwriting it with zeros.
pub fn wipe_bytes(buf: &mut [u8]) {
    buf.zeroize();
}

/// Wipe a mutable String by overwriting its backing buffer with zeros.
pub fn wipe_string(s: &mut String) {
    // Safety: we are overwriting the bytes in-place; the string becomes
    // garbage UTF-8 but we immediately clear it so it won't be used.
    unsafe { s.as_bytes_mut() }.zeroize();
    s.clear();
}

/// Wipe a mutable Vec<u8>.
pub fn wipe_vec(v: &mut Vec<u8>) {
    v.zeroize();
}