import { Envelope, type EnvelopeInput } from "@blockchaincommons/envelope/all";
import {
  IS_A,
  SOURCE,
  TARGET,
  DATE,
  VERIFIABLE_AT,
  CONFORMS_TO,
} from "@blockchaincommons/known-values";
import {
  XID,
  PublicKeys,
  type PrivateKeys,
  type SigningOptions,
} from "@blockchaincommons/components";
import { UR, decodeURWith } from "@blockchaincommons/uniform-resources";
import type { XIDDocument } from "@blockchaincommons/xid";

export interface EdgeTargetInput {
  xidUr: string;
  extras?: Record<string, string | number | boolean>;
  /** Optional SSH public keys to embed as `sshSigningKey` (UR) — mirrors
   * the upstream tutorial's `pred-obj string "sshSigningKey" ur $SSH_PUBKEYS`. */
  sshPublicKeysUr?: string;
}

export interface EdgeBuildInput {
  subject: string;
  isA: string;
  source: EdgeTargetInput;
  target: EdgeTargetInput;
  date?: Date;
  conformsTo?: string;
  verifiableAt?: string;
}

// Edge `source` / `target` sub-envelopes are built from the XID *identifier*
// (a tagged value), not the full XID document envelope. Parse the `ur:xid/…`
// string and wrap it as an envelope subject.
function parseXid(ur: string): Envelope {
  return Envelope.from(decodeURWith(UR.parse(ur), XID.codec));
}

function buildSubEnvelope(input: EdgeTargetInput): Envelope {
  let env = parseXid(input.xidUr);
  if (input.extras) {
    for (const [k, v] of Object.entries(input.extras)) {
      if (v === undefined || v === null || v === "") continue;
      env = env.addAssertion(k, v);
    }
  }
  if (input.sshPublicKeysUr) {
    const pubKeys = decodeURWith(UR.parse(input.sshPublicKeysUr), PublicKeys.codec);
    env = env.addAssertion("sshSigningKey", pubKeys);
  }
  return env;
}

/** Build + wrap + sign an edge envelope (§3.1 pattern).
 *
 * SSH signing keys need a per-signer `SigningOptions` of type `Ssh`
 * (`namespace`, `hashAlg`) — the same defaults the `envelope sign` CLI uses.
 */
export function buildSignedEdge(input: EdgeBuildInput, signer: PrivateKeys): Envelope {
  const src = buildSubEnvelope(input.source);
  let tgt = buildSubEnvelope(input.target);

  // BCR-2026-003: an edge subject may carry *only* `isA`, `source`, and
  // `target`. Any additional claim detail (`conformsTo`, `date`,
  // `verifiableAt`) belongs on the target sub-envelope — exactly as upstream
  // XID-Quickstart §3.1 builds it. Placing them here keeps edge validation
  // happy and matches the Rust reference structure.
  if (input.conformsTo) tgt = tgt.addAssertion(CONFORMS_TO, input.conformsTo);
  if (input.date) tgt = tgt.addAssertion(DATE, input.date.toISOString());
  if (input.verifiableAt) tgt = tgt.addAssertion(VERIFIABLE_AT, input.verifiableAt);

  const edge = Envelope.from(input.subject)
    .addAssertion(IS_A, input.isA)
    .addAssertionEnvelope(Envelope.assertion(SOURCE, src))
    .addAssertionEnvelope(Envelope.assertion(TARGET, tgt));

  const options: SigningOptions | undefined = signer.signingPrivateKey.isSsh()
    ? { type: "Ssh", namespace: "envelope", hashAlg: "sha256" }
    : undefined;
  return options ? edge.sign(signer, { signing: options }) : edge.sign(signer);
}

/** Attach a signed edge to a XID. */
export function attachEdge(doc: XIDDocument, signedEdge: Envelope): void {
  doc.addEdge(signedEdge);
}

/** Remove an edge by its digest. */
export function removeEdgeByDigest(doc: XIDDocument, edge: Envelope): boolean {
  const removed = doc.removeEdge(edge.digest());
  return removed !== undefined;
}

/** Navigate into an edge to get the unwrapped inner envelope. */
export function unwrapEdge(edge: Envelope): Envelope {
  return edge.unwrap();
}

/** Pull the target sub-envelope out of a wrapped edge. */
export function extractEdgeTarget(edge: Envelope): Envelope {
  const inner = edge.unwrap();
  const targetAssertion = inner.assertionWithPredicate(TARGET);
  // targetAssertion is a full assertion envelope. The object is the target sub-envelope.
  const c = targetAssertion.case;
  if (c.type !== "assertion") throw new Error("target predicate is not an assertion");
  return c.assertion.object();
}

/** Pull a named assertion's string value out of a sub-envelope. */
export function extractString(env: Envelope, predicate: unknown): string | undefined {
  try {
    return env.objectForPredicate(predicate as EnvelopeInput).asText();
  } catch {
    return undefined;
  }
}

/** Verify a signed edge's signature against a given SSH or attestation key. */
export function verifyEdgeSignature(edge: Envelope, pub: PublicKeys): boolean {
  try {
    return edge.hasSignatureFrom(pub);
  } catch {
    return false;
  }
}

/** Pull the embedded SSH `PublicKeys` out of an edge's target sub-envelope.
 *
 * The edge target was built with `addAssertion("sshSigningKey", pubKeys)`
 * (`buildSubEnvelope`), so the object is a tagged-CBOR `PublicKeys`. This
 * mirrors the upstream §3.2 verification flow which extracts the SSH key from
 * the GitHub attachment and verifies the signature against it. */
export function extractEdgeSshPublicKeys(edge: Envelope): PublicKeys | undefined {
  try {
    const target = extractEdgeTarget(edge);
    const obj = target.objectForPredicate("sshSigningKey");
    return obj.expectSubject((cbor) => PublicKeys.fromCbor(cbor));
  } catch {
    return undefined;
  }
}
