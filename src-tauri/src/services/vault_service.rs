use std::path::PathBuf;
use zeroize::Zeroizing;

use crate::{
    crypto::recovery::RecoveryKey,
    models::vault::VaultInfo,
    utils::errors::VaultisResult,
    vault::vault_manager,
};

pub struct VaultService;

impl VaultService {
    pub fn vault_exists(data_dir: &PathBuf) -> bool {
        vault_manager::vault_exists(data_dir)
    }

    pub fn create_vault(
        data_dir: &PathBuf,
        password: &str,
        display_name: &str,
    ) -> VaultisResult<RecoveryKey> {
        vault_manager::create_vault(data_dir, password, display_name)
    }

    pub fn unlock_vault(
        data_dir: &PathBuf,
        password: &str,
    ) -> VaultisResult<Zeroizing<[u8; 32]>> {
        vault_manager::unlock_vault(data_dir, password)
    }

    pub fn unlock_with_recovery(
        data_dir: &PathBuf,
        recovery_key: &str,
    ) -> VaultisResult<Zeroizing<[u8; 32]>> {
        vault_manager::unlock_with_recovery(data_dir, recovery_key)
    }

    pub fn change_password(
        data_dir: &PathBuf,
        current_password: &str,
        new_password: &str,
    ) -> VaultisResult<()> {
        vault_manager::change_master_password(data_dir, current_password, new_password)
    }

    pub fn get_vault_info(data_dir: &PathBuf) -> VaultisResult<VaultInfo> {
        vault_manager::get_vault_info(data_dir)
    }
}