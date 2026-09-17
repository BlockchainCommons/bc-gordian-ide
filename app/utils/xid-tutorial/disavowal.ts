import { Envelope } from "@blockchaincommons/envelope/all";
import { IS_A, SOURCE, TARGET, DATE, NICKNAME } from "@blockchaincommons/known-values";
import { XID, type PrivateKeys, type SigningOptions } from "@blockchaincommons/components";
import { UR, decodeURWith } from "@blockchaincommons/uniform-resources";
import type { DisavowedKey } from "./keys";

export interface DisavowalInput {
  /** UR of the disavowing party's XID identifier (becomes subject + edge source). */
  disavowerXidUr: string;
  /** Unique edge subject, e.g. `disavowal-statement-20260505`. */
  subject: string;
  statement: string;
  reason: string;
  date?: Date;
  keys: DisavowedKey[];
}

/**
 * Build + wrap + sign a disavowal statement. Byte-for-byte structural mirror of
 * upstream XID-Quickstart §5.5 Step 9: a standard edge (`isA` / `source` /
 * `target`, per §3.1) whose `target` is an attestation listing each disavowed
 * key (its public keys, `nickname`, and `xidKeyDigest`). Signed by a current,
 * non-compromised key (the new attestation key).
 */
export function buildSignedDisavowal(input: DisavowalInput, signer: PrivateKeys): Envelope {
  const xid = decodeURWith(UR.parse(input.disavowerXidUr), XID.codec);

  // The disavowal attestation — this becomes the edge `target`.
  let disavowal = Envelope.from(xid)
    .addAssertion("disavowalStatement", input.statement)
    .addAssertion("disavowalReason", input.reason)
    .addAssertion(DATE, (input.date ?? new Date()).toISOString());

  // Recursively embed each disavowed key as a `disavowedKey` sub-envelope.
  for (const k of input.keys) {
    const keyEnv = Envelope.from(k.pubKeys)
      .addAssertion(NICKNAME, k.nickname)
      .addAssertion("xidKeyDigest", k.assertionDigest);
    disavowal = disavowal.addAssertionEnvelope(Envelope.assertion("disavowedKey", keyEnv));
  }

  // Wrap it in a standard edge with a unique subject + isA/source/target.
  const edge = Envelope.from(input.subject)
    .addAssertion(IS_A, "signature-disavowal")
    .addAssertion(SOURCE, xid)
    .addAssertionEnvelope(Envelope.assertion(TARGET, disavowal));

  // The signer is a freshly-rotated key, so it's never SSH-backed here.
  const options: SigningOptions | undefined = signer.signingPrivateKey.isSsh()
    ? { type: "Ssh", namespace: "envelope", hashAlg: "sha256" }
    : undefined;
  return options ? edge.sign(signer, { signing: options }) : edge.sign(signer);
}
