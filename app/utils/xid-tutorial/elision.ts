import type { Envelope, EnvelopeInput } from "@blockchaincommons/envelope/all";

/** Fully elide an envelope by removing its own root digest target.
 *  Result is `ELIDED` alone — same digest as the original (§2.2 pattern). */
export function commitElide(signed: Envelope): Envelope {
  return signed.elide({ removing: [signed] });
}

/** Elide a specific assertion by predicate. The predicate stays in the tree; the whole
 *  assertion becomes ELIDED. */
export function elideAssertionByPredicate(env: Envelope, predicate: unknown): Envelope {
  try {
    const assertion = env.assertionWithPredicate(predicate as EnvelopeInput);
    return env.elide({ removing: [assertion] });
  } catch {
    return env;
  }
}

/** Elide only the object of an assertion (leaving the predicate visible). §4.3 pattern. */
export function elideObjectByPredicate(env: Envelope, predicate: unknown): Envelope {
  try {
    const obj = env.objectForPredicate(predicate as EnvelopeInput);
    return env.elide({ removing: [obj] });
  } catch {
    return env;
  }
}

/** Compare two envelopes' root digests for equality (inclusion proof check). */
export function digestsMatch(a: Envelope, b: Envelope): boolean {
  return a.digest().toHex() === b.digest().toHex();
}
