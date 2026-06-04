import React, { useState, useCallback } from "react";
import Button from "../../components/ui/Button.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useClipboard } from "../../hooks/useClipboard.js";
import usePasswordStore from "../../store/passwordStore.js";
import { getPasswordStrength } from "../../utils/helpers.js";
import { PASSWORD_STRENGTH_LABELS, PASSWORD_STRENGTH_COLORS } from "../../utils/constants.js";
import styles from "./PasswordGenerator.module.css";

export default function PasswordGenerator({ onUse }) {
  const { success, error: showError } = useToast();
  const { copy, copied } = useClipboard();
  const generate = usePasswordStore(s => s.generate);

  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    length: 20,
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: true,
  });

  const strength = getPasswordStrength(generated);
  const strengthLabel = PASSWORD_STRENGTH_LABELS[strength];
  const strengthColor = PASSWORD_STRENGTH_COLORS[strength];

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    const result = await generate({
      length: options.length,
      uppercase: options.uppercase,
      lowercase: options.lowercase,
      digits: options.digits,
      symbols: options.symbols,
      excludeAmbiguous: options.excludeAmbiguous,
    });
    setLoading(false);

    if (result.ok) {
      setGenerated(result.password);
    } else {
      showError(result.error || "Generation failed");
    }
  }, [options, generate, showError]);

  const handleCopy = async () => {
    if (!generated) return;
    const ok = await copy(generated, "password");
    if (ok) success("Password copied — clears in 30s");
  };

  const handleUse = () => {
    if (!generated) return;
    onUse?.(generated);
  };

  const toggle = (key) => setOptions(o => ({ ...o, [key]: !o[key] }));

  const atLeastOneCharType =
    options.uppercase || options.lowercase || options.digits || options.symbols;

  return (
    <div className={styles.generator}>
      {/* Generated password display */}
      <div className={styles.resultWrap}>
        {generated ? (
          <>
            <p className={styles.password} aria-label="Generated password">
              {generated}
            </p>
            <div className={styles.strengthBar}>
              {[0, 1, 2, 3, 4].map(i => (
                <span
                  key={i}
                  className={styles.strengthSegment}
                  style={{
                    background: i <= strength ? strengthColor : "var(--border-subtle)",
                  }}
                />
              ))}
              <span className={styles.strengthLabel} style={{ color: strengthColor }}>
                {strengthLabel}
              </span>
            </div>
          </>
        ) : (
          <p className={styles.placeholder}>Click "Generate" to create a password</p>
        )}
      </div>

      {/* Options */}
      <div className={styles.options}>
        {/* Length slider */}
        <div className={styles.optionRow}>
          <div className={styles.optionLabelRow}>
            <span className={styles.optionLabel}>Length</span>
            <span className={styles.optionValue}>{options.length}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={8}
            max={64}
            value={options.length}
            onChange={e => setOptions(o => ({ ...o, length: parseInt(e.target.value) }))}
          />
          <div className={styles.sliderLabels}>
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Character type toggles */}
        <div className={styles.toggleGroup}>
          <OptionToggle
            label="Uppercase"
            detail="A – Z"
            checked={options.uppercase}
            onChange={() => toggle("uppercase")}
          />
          <OptionToggle
            label="Lowercase"
            detail="a – z"
            checked={options.lowercase}
            onChange={() => toggle("lowercase")}
          />
          <OptionToggle
            label="Numbers"
            detail="0 – 9"
            checked={options.digits}
            onChange={() => toggle("digits")}
          />
          <OptionToggle
            label="Symbols"
            detail="! @ # $"
            checked={options.symbols}
            onChange={() => toggle("symbols")}
          />
          <OptionToggle
            label="Exclude ambiguous"
            detail="0 O l I"
            checked={options.excludeAmbiguous}
            onChange={() => toggle("excludeAmbiguous")}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="md"
          icon={<RefreshIcon />}
          onClick={handleGenerate}
          loading={loading}
          disabled={!atLeastOneCharType}
          fullWidth
        >
          Generate
        </Button>

        {generated && (
          <>
            <Button
              variant="outline"
              size="md"
              icon={copied === "password" ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopy}
              fullWidth
            >
              {copied === "password" ? "Copied!" : "Copy"}
            </Button>

            {/* {onUse && (
              <Button
                variant="primary"
                size="md"
                icon={<UseIcon />}
                onClick={handleUse}
                fullWidth
              >
                Use this password
              </Button>
            )} */}
          </>
        )}
      </div>
    </div>
  );
}

function OptionToggle({ label, detail, checked, onChange }) {
  return (
    <div className={styles.optionItem}>
      <div className={styles.optionText}>
        <span className={styles.optionLabel}>{label}</span>
        <span className={styles.optionDetail}>{detail}</span>
      </div>
      <button
        className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
        onClick={onChange}
        type="button"
        role="switch"
        aria-checked={checked}
      >
        <span className={styles.toggleKnob} />
      </button>
    </div>
  );
}

function RefreshIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>; }
function CopyIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function CheckIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function UseIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
