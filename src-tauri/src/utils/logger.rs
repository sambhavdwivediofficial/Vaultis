use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Initialize the global tracing subscriber.
/// In debug builds: pretty human-readable output to stdout.
/// In release builds: JSON-structured output + optional file sink.
pub fn init_logger() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            if cfg!(debug_assertions) {
                EnvFilter::new("vaultis=debug,tauri=warn")
            } else {
                EnvFilter::new("vaultis=info,tauri=error")
            }
        });

    #[cfg(debug_assertions)]
    {
        tracing_subscriber::registry()
            .with(filter)
            .with(
                fmt::layer()
                    .with_target(true)
                    .with_thread_ids(false)
                    .with_file(true)
                    .with_line_number(true)
                    .pretty(),
            )
            .init();
    }

    #[cfg(not(debug_assertions))]
    {
        tracing_subscriber::registry()
            .with(filter)
            .with(fmt::layer().json().with_target(false))
            .init();
    }
}