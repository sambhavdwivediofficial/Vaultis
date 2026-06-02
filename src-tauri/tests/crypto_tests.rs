#[cfg(test)]
mod crypto_tests {
    use vaultis_lib::crypto::{
        aes::{decrypt_from_base64, decrypt_string, encrypt_string, encrypt_to_base64},
        argon2::{derive_key, hash_password_for_storage, verify_password_hash},
        random::{generate_nonce, generate_salt, random_bytes, secure_random_password},
        recovery::{decrypt_key_with_recovery, encrypt_key_with_recovery, RecoveryKey},
        zeroize::{wipe_bytes, wipe_string},
    };

    // ── Random ────────────────────────────────────────────────────────────

    #[test]
    fn test_random_bytes_length() {
        for n in [0, 1, 12, 16, 32, 64, 256] {
            let bytes = random_bytes(n).expect("random_bytes failed");
            assert_eq!(bytes.len(), n, "Expected {n} bytes");
        }
    }

    #[test]
    fn test_random_bytes_not_all_zero() {
        let bytes = random_bytes(32).unwrap();
        // Probability of all zeros is 2^-256 — effectively impossible
        assert!(bytes.iter().any(|&b| b != 0), "Random bytes were all zero");
    }

    #[test]
    fn test_generate_salt_unique() {
        let s1 = generate_salt().unwrap();
        let s2 = generate_salt().unwrap();
        assert_ne!(s1, s2, "Two salts should not be identical");
    }

    #[test]
    fn test_generate_nonce_unique() {
        let n1 = generate_nonce().unwrap();
        let n2 = generate_nonce().unwrap();
        assert_ne!(n1, n2, "Two nonces should not be identical");
    }

    #[test]
    fn test_secure_random_password_length() {
        let charset = b"abcdefghijklmnopqrstuvwxyz0123456789";
        for len in [8, 16, 32, 64] {
            let pwd = secure_random_password(len, charset).unwrap();
            assert_eq!(pwd.len(), len);
        }
    }

    #[test]
    fn test_secure_random_password_uses_charset() {
        let charset = b"abc";
        let pwd = secure_random_password(100, charset).unwrap();
        assert!(pwd.chars().all(|c| matches!(c, 'a' | 'b' | 'c')));
    }

    // ── Argon2 ────────────────────────────────────────────────────────────

    #[test]
    fn test_derive_key_deterministic() {
        let password = "test_password_42!";
        let salt = generate_salt().unwrap();
        let k1 = derive_key(password, &salt).unwrap();
        let k2 = derive_key(password, &salt).unwrap();
        assert_eq!(k1.as_slice(), k2.as_slice(), "Same password+salt must yield same key");
    }

    #[test]
    fn test_derive_key_different_salts() {
        let password = "same_password";
        let s1 = generate_salt().unwrap();
        let s2 = generate_salt().unwrap();
        let k1 = derive_key(password, &s1).unwrap();
        let k2 = derive_key(password, &s2).unwrap();
        assert_ne!(k1.as_slice(), k2.as_slice(), "Different salts must produce different keys");
    }

    #[test]
    fn test_derive_key_different_passwords() {
        let salt = generate_salt().unwrap();
        let k1 = derive_key("password_one", &salt).unwrap();
        let k2 = derive_key("password_two", &salt).unwrap();
        assert_ne!(k1.as_slice(), k2.as_slice());
    }

    #[test]
    fn test_password_hash_verify_correct() {
        let password = "MySecurePassword!99";
        let hash = hash_password_for_storage(password).unwrap();
        let result = verify_password_hash(password, &hash).unwrap();
        assert!(result, "Correct password should verify");
    }

    #[test]
    fn test_password_hash_verify_wrong() {
        let hash = hash_password_for_storage("correct_password").unwrap();
        let result = verify_password_hash("wrong_password", &hash).unwrap();
        assert!(!result, "Wrong password must not verify");
    }

    // ── AES-256-GCM ───────────────────────────────────────────────────────

    fn test_key() -> [u8; 32] {
        let salt = generate_salt().unwrap();
        *derive_key("test_password", &salt).unwrap()
    }

    #[test]
    fn test_aes_encrypt_decrypt_roundtrip() {
        let key = test_key();
        let plaintext = b"Hello, Vaultis! This is secret data.";
        let encoded = encrypt_to_base64(&key, plaintext).unwrap();
        let decoded = decrypt_from_base64(&key, &encoded).unwrap();
        assert_eq!(decoded.as_slice(), plaintext);
    }

    #[test]
    fn test_aes_string_encrypt_decrypt() {
        let key = test_key();
        let original = "Sambhav's private note \u{1F511}";
        let encrypted = encrypt_string(&key, original).unwrap();
        let decrypted = decrypt_string(&key, &encrypted).unwrap();
        assert_eq!(decrypted, original);
    }

    #[test]
    fn test_aes_different_nonces_each_time() {
        let key = test_key();
        let data = b"same plaintext";
        let enc1 = encrypt_to_base64(&key, data).unwrap();
        let enc2 = encrypt_to_base64(&key, data).unwrap();
        // Ciphertexts differ because nonces are random
        assert_ne!(enc1, enc2, "Each encryption should produce a unique ciphertext");
        // But both decrypt to the same plaintext
        let d1 = decrypt_from_base64(&key, &enc1).unwrap();
        let d2 = decrypt_from_base64(&key, &enc2).unwrap();
        assert_eq!(d1.as_slice(), data);
        assert_eq!(d2.as_slice(), data);
    }

    #[test]
    fn test_aes_wrong_key_fails() {
        let key1 = test_key();
        let key2 = test_key();
        let encrypted = encrypt_to_base64(&key1, b"secret").unwrap();
        let result = decrypt_from_base64(&key2, &encrypted);
        assert!(result.is_err(), "Decryption with wrong key must fail");
    }

    #[test]
    fn test_aes_tampered_ciphertext_fails() {
        let key = test_key();
        let mut encoded = encrypt_to_base64(&key, b"important data").unwrap();
        // Flip the last character of the base64 to simulate tampering
        let last = encoded.pop().unwrap();
        let replacement = if last == 'A' { 'B' } else { 'A' };
        encoded.push(replacement);
        let result = decrypt_from_base64(&key, &encoded);
        assert!(result.is_err(), "Tampered ciphertext must be rejected");
    }

    #[test]
    fn test_aes_empty_plaintext() {
        let key = test_key();
        let encoded = encrypt_to_base64(&key, b"").unwrap();
        let decoded = decrypt_from_base64(&key, &encoded).unwrap();
        assert_eq!(decoded.as_slice(), b"");
    }

    #[test]
    fn test_aes_large_plaintext() {
        let key = test_key();
        let large = vec![0xAB_u8; 1024 * 1024]; // 1 MB
        let encoded = encrypt_to_base64(&key, &large).unwrap();
        let decoded = decrypt_from_base64(&key, &encoded).unwrap();
        assert_eq!(decoded.as_slice(), large.as_slice());
    }

    // ── Recovery Key ──────────────────────────────────────────────────────

    #[test]
    fn test_recovery_key_format() {
        let key = RecoveryKey::generate().unwrap();
        let parts: Vec<&str> = key.display.split('-').collect();
        assert_eq!(parts.len(), 16, "Recovery key should have 16 segments");
        for part in &parts {
            assert_eq!(part.len(), 4, "Each segment should be 4 chars");
            assert!(part.chars().all(|c| c.is_ascii_hexdigit() || c.is_ascii_uppercase()));
        }
    }

    #[test]
    fn test_recovery_key_parse_roundtrip() {
        let key = RecoveryKey::generate().unwrap();
        let parsed = RecoveryKey::from_str(&key.display).unwrap();
        assert_eq!(key.raw(), parsed.raw());
    }

    #[test]
    fn test_recovery_key_parse_no_dashes() {
        let key = RecoveryKey::generate().unwrap();
        let no_dashes = key.display.replace('-', "");
        let parsed = RecoveryKey::from_str(&no_dashes).unwrap();
        assert_eq!(key.raw(), parsed.raw());
    }

    #[test]
    fn test_recovery_key_invalid_rejected() {
        assert!(RecoveryKey::from_str("INVALID").is_err());
        assert!(RecoveryKey::from_str("").is_err());
        // 16 segments of non-hex chars
        assert!(RecoveryKey::from_str("ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ").is_err());
    }

    #[test]
    fn test_recovery_encrypt_decrypt() {
        let recovery = RecoveryKey::generate().unwrap();
        let salt = generate_salt().unwrap();
        let master_key = derive_key("my_master_password", &salt).unwrap();

        let blob = encrypt_key_with_recovery(&master_key, &recovery).unwrap();
        let recovered = decrypt_key_with_recovery(&blob, &recovery).unwrap();

        assert_eq!(master_key.as_slice(), recovered.as_slice());
    }

    #[test]
    fn test_recovery_wrong_key_fails() {
        let r1 = RecoveryKey::generate().unwrap();
        let r2 = RecoveryKey::generate().unwrap();
        let salt = generate_salt().unwrap();
        let master_key = derive_key("password", &salt).unwrap();

        let blob = encrypt_key_with_recovery(&master_key, &r1).unwrap();
        let result = decrypt_key_with_recovery(&blob, &r2);
        assert!(result.is_err());
    }

    // ── Zeroize ───────────────────────────────────────────────────────────

    #[test]
    fn test_wipe_bytes() {
        let mut data = vec![0xDE_u8, 0xAD, 0xBE, 0xEF];
        wipe_bytes(&mut data);
        assert!(data.iter().all(|&b| b == 0), "Bytes must be zeroed");
    }

    #[test]
    fn test_wipe_string() {
        let mut s = String::from("super_secret_password");
        wipe_string(&mut s);
        assert!(s.is_empty(), "String must be cleared after wiping");
    }
}