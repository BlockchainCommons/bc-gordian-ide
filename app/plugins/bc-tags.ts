import { registerTags as registerComponentTags } from "@blockchaincommons/components/tags";
import { registerTags as registerEnvelopeTags } from "@blockchaincommons/envelope/all";
import { registerTags as registerProvenanceMarkTags } from "@blockchaincommons/provenance-mark";

// Name the Blockchain Commons CBOR tags in the global dcbor store (URs need
// them) and install every envelope summariser, provenance marks included,
// before anything is formatted. Every call is idempotent.
export default defineNuxtPlugin(() => {
  registerComponentTags();
  registerEnvelopeTags();
  registerProvenanceMarkTags();
});
