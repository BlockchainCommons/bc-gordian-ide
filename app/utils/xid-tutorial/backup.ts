import { Envelope, sskrJoin } from "@blockchaincommons/envelope/all";
import { SymmetricKey } from "@blockchaincommons/components";
import { KeyDerivationMethod } from "@blockchaincommons/components/kdf";
import { Spec, GroupSpec } from "@blockchaincommons/sskr";
import { UR, decodeURWith } from "@blockchaincommons/uniform-resources";

const textEncoder = new TextEncoder();

/**
 * SSKR-split an envelope into flat share UR strings. Byte-for-byte mirror of
 * `envelope sskr split`: wrap the envelope, encrypt its subject under a fresh
 * random content key, then split that key across the requested groups.
 * Default tutorial spec is `(1, [[2,3]])` → a single 2-of-3 group.
 * (§5.3 / §5.4 / §5.5)
 */
export function sskrSplitEnvelope(
  env: Envelope,
  groupThreshold: number,
  groups: [number, number][],
): string[] {
  const contentKey = SymmetricKey.random();
  const wrapped = env.wrap();
  const encrypted = wrapped.encryptSubject(contentKey);
  const groupSpecs = groups.map(([m, n]) => GroupSpec.from({ memberThreshold: m, memberCount: n }));
  const spec = Spec.from({ groupThreshold, groups: groupSpecs });
  const shares = encrypted.sskrSplit(spec, contentKey).flat();
  return shares.map((s) => s.toUR().toString());
}

/**
 * Recombine SSKR shares back into the original envelope. Mirror of
 * `envelope sskr join`: combine the shares to recover the wrapped envelope,
 * then unwrap it. (§5.3 / §5.5)
 */
export function sskrJoinShares(shareUrs: string[]): Envelope {
  const envs = shareUrs.map((ur) => decodeURWith(UR.parse(ur.trim()), Envelope.codec));
  const wrapped = sskrJoin(envs);
  return wrapped.unwrap();
}

/** Safe wrapper around {@link sskrJoinShares}. */
export function trySskrJoin(
  shareUrs: string[],
): { ok: true; env: Envelope } | { ok: false; reason: string } {
  try {
    return { ok: true, env: sskrJoinShares(shareUrs) };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "recovery failed" };
  }
}

/**
 * Password-encrypt an envelope's subject (Argon2id). Mirror of
 * `envelope encrypt --password`: encrypt the subject under a fresh content
 * key, then lock that content key with the password via `addSecret`. (§5.4)
 */
export function passwordEncrypt(env: Envelope, password: string): Envelope {
  const contentKey = SymmetricKey.random();
  const encrypted = env.encryptSubject(contentKey);
  return encrypted.addSecret(
    KeyDerivationMethod.Argon2id,
    textEncoder.encode(password),
    contentKey,
  );
}
