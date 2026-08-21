/**
 * Shapes for the online-payments configuration screen.
 *
 * ⚠ **No type here can carry a credential value.** The closest thing is `fields_set`: per-field
 * booleans saying whether *something* is stored. Not a value, not a length, not a masked tail —
 * each of those narrows a guess, and the only question the screen has is "do I need to type
 * this again?".
 */

export interface CredentialFieldManifest {
  /** Stable storage key. Renaming one orphans stored values even though no column changes. */
  key: string;
  label: string;
  hint?: string | null;
  /** Render masked and never echo back. `false` is a deliberate statement that the value is an
   *  identifier, not a secret — a future Connect-style adapter's credentials are exactly that. */
  is_secret: boolean;
}

export interface ProviderCapabilities {
  supported_methods: string[];
  supports_refund: boolean;
  supports_partial_refund: boolean;
  callback_registration: "per_transaction" | "per_account";
  /** The studio pastes the callback URL into the provider's own panel by hand.
   *
   *  ⚠ Not the same as `callback_registration === "per_account"`. Stripe is account-level and
   *  registers its own webhook; paynow is account-level and has no API to register anything.
   *  Keying the notice off `per_account` would show Stripe studios a step they cannot do. */
  requires_manual_callback_url: boolean;
}

export interface ProviderManifest {
  provider_key: string;
  display_name: string;
  /** Where the studio finds these values in the provider's own panel. */
  documentation_url: string;
  /** Where inside that panel the callback URL goes. Only providers that need it by hand set
   *  this — and this screen names no provider, so it is the only place the copy can come from. */
  callback_instructions?: string | null;
  fields: CredentialFieldManifest[];
  capabilities: ProviderCapabilities;
}

export interface StudioProviderState {
  provider_key: string;
  display_name: string;
  state: "pending" | "active" | "disabled";
  last_verified_at?: string | null;
  last_verification_error?: string | null;
  fields_set: Record<string, boolean>;
  /** The URL to paste, already built for this studio and this configuration row. `null` for
   *  every provider that does not need one — which is what the notice keys off, so no
   *  provider name is involved.
   *
   *  It contains the configuration row's id, so it does not exist until credentials have been
   *  saved once. That is why the notice appears after saving and not on the blank form. */
  callback_url?: string | null;
}

export interface StudioPaymentConfig {
  providers: ProviderManifest[];
  current?: StudioProviderState | null;
  /** Superseded configurations, kept so switching back needs no re-entry. */
  previous: StudioProviderState[];
  accepts_cash: boolean;
}

export interface SaveCredentialsResponse {
  verified: boolean;
  state: string;
  /** The adapter's own reason — it is what tells the studio which field they got wrong. */
  error?: string | null;
  current?: StudioProviderState | null;
}
