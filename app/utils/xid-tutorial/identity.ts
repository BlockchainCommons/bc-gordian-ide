import {
  XIDDocument,
  Key,
  type Privilege,
  type XIDGenesis,
  type XIDPrivateKeyOptions,
  type XIDGeneratorOptions,
} from "@blockchaincommons/xid";
import { Envelope } from "@blockchaincommons/envelope/all";
import {
  PrivateKeyBase,
  PrivateKeys,
  PublicKeys,
  SignatureScheme,
  createKeypair,
  createEncapsulationKeypair,
  EncapsulationScheme,
} from "@blockchaincommons/components";
import { UR, decodeURWith } from "@blockchaincommons/uniform-resources";
import type { SideKey } from "./types";

const textEncoder = new TextEncoder();

export type TutorialScheme = "Ed25519" | "Schnorr" | "ECDSA" | "SshEd25519";

function schemeEnum(s: TutorialScheme): SignatureScheme {
  switch (s) {
    case "Ed25519":
      return SignatureScheme.Ed25519;
    case "Schnorr":
      return SignatureScheme.Schnorr;
    case "ECDSA":
      return SignatureScheme.Ecdsa;
    case "SshEd25519":
      return SignatureScheme.SshEd25519;
  }
}

/** Create a XID with password-encrypted private key and provenance generator (§1.3). */
export function createEncryptedXid(
  nickname: string,
  scheme: TutorialScheme,
  password: string,
  withProvenance: boolean,
): XIDDocument {
  const genesis: XIDGenesis | undefined =
    withProvenance && password
      ? {
          passphrase: password,
          resolution: "high",
          date: new Date(),
        }
      : undefined;

  if (scheme === "Schnorr") {
    // A random private key base gives Schnorr keys directly via .schnorrPrivateKeys()/.schnorrPublicKeys()
    const doc = XIDDocument.random({ genesis });
    const key = doc.inceptionKey;
    if (key) doc.setNameForKey(key.publicKeys, nickname);
    return doc;
  }
  const [signingPrv, signingPub] = createKeypair(schemeEnum(scheme));
  const [encPrv, encPub] = createEncapsulationKeypair(EncapsulationScheme.X25519);
  const privateKeys = PrivateKeys.from({ signing: signingPrv, encapsulation: encPrv });
  const publicKeys = PublicKeys.from({ signing: signingPub, encapsulation: encPub });
  const doc = XIDDocument.from({ inceptionKey: { publicKeys, privateKeys }, genesis });
  const key = doc.inceptionKey;
  if (key) doc.setNameForKey(key.publicKeys, nickname);
  return doc;
}

function passwordBytes(password: string): Uint8Array {
  return textEncoder.encode(password);
}

/** Build the private-key options block for serialization. */
export function privateKeyOptions(password: string): XIDPrivateKeyOptions {
  if (!password) return "omit";
  return { encrypt: passwordBytes(password) };
}

export function generatorOptions(password: string): XIDGeneratorOptions {
  if (!password) return "omit";
  return { encrypt: passwordBytes(password) };
}

/** Export a private (encrypted) envelope for saving or restoring. */
export function exportPrivateEnvelope(doc: XIDDocument, password: string): Envelope {
  return doc.toEnvelope({
    privateKeys: privateKeyOptions(password),
    generator: generatorOptions(password),
    sign: "inception",
  });
}

/** Export a public envelope (elided private keys + generator, still signed).
 *  Eliding the private keys and the generator preserves the digest tree so the
 *  inception signature still verifies. */
export function exportPublicEnvelope(doc: XIDDocument): Envelope {
  return doc.toEnvelope({ privateKeys: "elide", generator: "elide", sign: "inception" });
}

/** Reload a XID from a UR string, optionally using a password to decrypt private keys. */
export function loadXidFromUr(urString: string, password?: string): XIDDocument {
  const envelope = decodeURWith(UR.parse(urString), Envelope.codec);
  const pw = password ? passwordBytes(password) : undefined;
  return XIDDocument.fromEnvelope(envelope, { password: pw, verify: "none" });
}

/** Verify the inception signature on a public envelope. */
export function verifyInceptionSignature(publicUr: string): boolean {
  try {
    const envelope = decodeURWith(UR.parse(publicUr), Envelope.codec);
    XIDDocument.fromEnvelope(envelope, { verify: "inception" });
    return true;
  } catch {
    return false;
  }
}

/** Generate a side keypair (e.g. attestation / contract / SSH signing key). */
export function generateSideKey(nickname: string, scheme: TutorialScheme): SideKey {
  if (scheme === "Schnorr") {
    const base = PrivateKeyBase.random();
    return {
      nickname,
      prvKeys: base.schnorrPrivateKeys(),
      pubKeys: base.schnorrPublicKeys(),
    };
  }
  const [signingPrv, signingPub] = createKeypair(schemeEnum(scheme));
  const [encPrv, encPub] = createEncapsulationKeypair(EncapsulationScheme.X25519);
  return {
    nickname,
    prvKeys: PrivateKeys.from({ signing: signingPrv, encapsulation: encPrv }),
    pubKeys: PublicKeys.from({ signing: signingPub, encapsulation: encPub }),
  };
}

/** Register a side key inside the XID with a nickname + limited permissions. */
export function addSideKeyToXid(doc: XIDDocument, side: SideKey, allow: Privilege[]): void {
  const key = Key.from(side.pubKeys, { privateKeys: side.prvKeys });
  for (const p of allow) key.addAllow(p);
  key.setNickname(side.nickname);
  doc.addKey(key);
}

/** Export the SSH public key as its human-readable `ssh-ed25519 …` line —
 *  mirrors the upstream tutorial's `envelope export "$SSH_PUBKEYS"` output. */
export function sshPublicKeyText(pubKeys: PublicKeys): string {
  return pubKeys.signingPublicKey.toSshOpenssh();
}
