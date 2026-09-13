/**
 * Device biometric (fingerprint / Face ID) helpers.
 *
 * The platform authenticator is used as a *device-level* second factor:
 * the credential id is stored per user in `trusted_devices`, and unlocking
 * requires the OS biometric prompt on that same device.
 */

function bufToB64url(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBuf(value: string) {
  const pad = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function randomChallenge() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes.buffer;
}

export function webauthnSupported() {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export async function platformAuthenticatorAvailable() {
  if (!webauthnSupported()) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function deviceLabel() {
  if (typeof navigator === "undefined") return "Device";
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Browser";
  return `${os} · ${browser}`;
}

/** Registers a platform credential and returns its base64url id. */
export async function registerBiometric(userId: string, userName: string) {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: { name: "SyndeoCare", id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("no-credential");
  return bufToB64url(credential.rawId);
}

/** Prompts the biometric sensor for one of the given credential ids. */
export async function verifyBiometric(credentialIds: string[]) {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      rpId: window.location.hostname,
      allowCredentials: credentialIds.map((id) => ({
        type: "public-key" as const,
        id: b64urlToBuf(id),
      })),
      userVerification: "required",
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  if (!assertion) throw new Error("no-assertion");
  return bufToB64url(assertion.rawId);
}
