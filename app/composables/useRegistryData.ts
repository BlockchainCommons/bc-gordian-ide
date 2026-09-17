/**
 * Composable for registry data from @blockchaincommons/tags and @blockchaincommons/known-values
 *
 * This composable imports the actual tag and known value definitions from the
 * source packages and adds category metadata for display purposes.
 */

import type { Tag } from "@blockchaincommons/dcbor";
import * as tags from "@blockchaincommons/tags";
import { BUNDLED_REGISTRY } from "@blockchaincommons/known-values";

export interface TagItem {
  value: number;
  name: string;
  category: string;
  deprecated?: boolean;
}

export interface KnownValueItem {
  value: number;
  name: string;
  category: string;
}

// Category mappings for tags (by tag value)
const tagCategories: Record<number, { category: string; deprecated?: boolean }> = {
  // Standard IANA
  32: { category: "Standard IANA" },
  37: { category: "Standard IANA" },

  // Core Envelope
  24: { category: "Core Envelope" },
  200: { category: "Core Envelope" },
  201: { category: "Core Envelope" },
  262: { category: "Core Envelope" },

  // Envelope Extensions
  40000: { category: "Envelope Extension" },
  40001: { category: "Envelope Extension" },
  40002: { category: "Envelope Extension" },
  40003: { category: "Envelope Extension" },

  // Function Calls
  40004: { category: "Function Calls" },
  40005: { category: "Function Calls" },
  40006: { category: "Function Calls" },
  40007: { category: "Function Calls" },
  40008: { category: "Function Calls" },
  40009: { category: "Function Calls" },

  // Cryptography
  40010: { category: "Cryptography" },
  40011: { category: "Cryptography" },
  40012: { category: "Cryptography" },
  40013: { category: "Cryptography" },
  40014: { category: "Cryptography" },
  40015: { category: "Cryptography" },
  40016: { category: "Cryptography" },
  40017: { category: "Cryptography" },
  40018: { category: "Cryptography" },
  40019: { category: "Cryptography" },
  40020: { category: "Cryptography" },
  40021: { category: "Cryptography" },
  40022: { category: "Cryptography" },
  40023: { category: "Cryptography" },
  40024: { category: "Cryptography" },
  40025: { category: "Cryptography" },
  40026: { category: "Cryptography" },
  40027: { category: "Cryptography" },

  // Post-Quantum
  40100: { category: "Post-Quantum" },
  40101: { category: "Post-Quantum" },
  40102: { category: "Post-Quantum" },
  40103: { category: "Post-Quantum" },
  40104: { category: "Post-Quantum" },
  40105: { category: "Post-Quantum" },

  // Seeds & Keys
  40300: { category: "Seeds & Keys" },
  40303: { category: "Seeds & Keys" },
  40304: { category: "Seeds & Keys" },
  40305: { category: "Seeds & Keys" },
  40306: { category: "Seeds & Keys" },
  40307: { category: "Seeds & Keys" },
  40308: { category: "Seeds & Keys" },
  40309: { category: "Seeds & Keys" },
  40310: { category: "Seeds & Keys" },
  40311: { category: "Seeds & Keys" },

  // SSH
  40800: { category: "SSH" },
  40801: { category: "SSH" },
  40802: { category: "SSH" },
  40803: { category: "SSH" },

  // Provenance
  1347571542: { category: "Provenance" },

  // Deprecated
  300: { category: "Deprecated", deprecated: true },
  303: { category: "Deprecated", deprecated: true },
  304: { category: "Deprecated", deprecated: true },
  305: { category: "Deprecated", deprecated: true },
  306: { category: "Deprecated", deprecated: true },
  307: { category: "Deprecated", deprecated: true },
  309: { category: "Deprecated", deprecated: true },
  310: { category: "Deprecated", deprecated: true },
  311: { category: "Deprecated", deprecated: true },

  // Output Descriptors
  400: { category: "Output Descriptors" },
  401: { category: "Output Descriptors" },
  402: { category: "Output Descriptors" },
  403: { category: "Output Descriptors" },
  404: { category: "Output Descriptors" },
  405: { category: "Output Descriptors" },
  406: { category: "Output Descriptors" },
  407: { category: "Output Descriptors" },
  408: { category: "Output Descriptors" },
  409: { category: "Output Descriptors" },
  410: { category: "Output Descriptors" },
};

// Category mappings for known values (by value ranges matching registry files)
function getKnownValueCategory(value: number): string {
  // Blockchain Commons registry (0-999) — use fine-grained sub-categories
  if (value < 1000) {
    if (value <= 24) return "General";
    if (value >= 50 && value <= 52) return "Attachments";
    if (value >= 60 && value <= 68) return "XID Documents";
    if (value >= 70 && value <= 86) return "XID Privileges";
    if (value >= 100 && value <= 108) return "Expressions";
    if (value >= 200 && value <= 203) return "Cryptography";
    if (value >= 300 && value <= 303) return "Crypto Assets";
    if (value >= 400 && value <= 402) return "Networks";
    if (value >= 500 && value <= 508) return "Bitcoin";
    if (value >= 600 && value <= 705) return "Graphs";
    return "General";
  }
  // Ontology registries (by start_code_point ranges)
  if (value < 2000) return "Community";
  if (value < 2050) return "RDF";
  if (value < 2100) return "RDFS";
  if (value < 2200) return "OWL2";
  if (value < 2300) return "DCE";
  if (value < 2500) return "DCT";
  if (value < 2700) return "FOAF";
  if (value < 2800) return "SKOS";
  if (value < 2900) return "Solid";
  if (value < 3000) return "VC";
  if (value < 10000) return "GS1";
  if (value < 100000) return "Schema";
  return "Community";
}

// Build tags data from the @blockchaincommons/tags package
function buildTagsData(): TagItem[] {
  const tagList: readonly Tag[] = [
    tags.TAG_URI,
    tags.TAG_UUID,
    tags.TAG_ENCODED_CBOR,
    tags.TAG_ENVELOPE,
    tags.TAG_LEAF,
    tags.TAG_JSON,
    tags.TAG_KNOWN_VALUE,
    tags.TAG_DIGEST,
    tags.TAG_ENCRYPTED,
    tags.TAG_COMPRESSED,
    tags.TAG_REQUEST,
    tags.TAG_RESPONSE,
    tags.TAG_FUNCTION,
    tags.TAG_PARAMETER,
    tags.TAG_PLACEHOLDER,
    tags.TAG_REPLACEMENT,
    tags.TAG_X25519_PRIVATE_KEY,
    tags.TAG_X25519_PUBLIC_KEY,
    tags.TAG_ARID,
    tags.TAG_PRIVATE_KEYS,
    tags.TAG_NONCE,
    tags.TAG_PASSWORD,
    tags.TAG_PRIVATE_KEY_BASE,
    tags.TAG_PUBLIC_KEYS,
    tags.TAG_SALT,
    tags.TAG_SEALED_MESSAGE,
    tags.TAG_SIGNATURE,
    tags.TAG_SIGNING_PRIVATE_KEY,
    tags.TAG_SIGNING_PUBLIC_KEY,
    tags.TAG_SYMMETRIC_KEY,
    tags.TAG_XID,
    tags.TAG_REFERENCE,
    tags.TAG_EVENT,
    tags.TAG_ENCRYPTED_KEY,
    tags.TAG_MLKEM_PRIVATE_KEY,
    tags.TAG_MLKEM_PUBLIC_KEY,
    tags.TAG_MLKEM_CIPHERTEXT,
    tags.TAG_MLDSA_PRIVATE_KEY,
    tags.TAG_MLDSA_PUBLIC_KEY,
    tags.TAG_MLDSA_SIGNATURE,
    tags.TAG_SEED,
    tags.TAG_HDKEY,
    tags.TAG_DERIVATION_PATH,
    tags.TAG_USE_INFO,
    tags.TAG_EC_KEY,
    tags.TAG_ADDRESS,
    tags.TAG_OUTPUT_DESCRIPTOR,
    tags.TAG_SSKR_SHARE,
    tags.TAG_PSBT,
    tags.TAG_ACCOUNT_DESCRIPTOR,
    tags.TAG_SSH_TEXT_PRIVATE_KEY,
    tags.TAG_SSH_TEXT_PUBLIC_KEY,
    tags.TAG_SSH_TEXT_SIGNATURE,
    tags.TAG_SSH_TEXT_CERTIFICATE,
    tags.TAG_PROVENANCE_MARK,
    // Deprecated tags
    tags.LEGACY_TAGS.SEED_V1,
    tags.LEGACY_TAGS.EC_KEY_V1,
    tags.LEGACY_TAGS.SSKR_SHARE_V1,
    tags.LEGACY_TAGS.HDKEY_V1,
    tags.LEGACY_TAGS.DERIVATION_PATH_V1,
    tags.LEGACY_TAGS.USE_INFO_V1,
    tags.LEGACY_TAGS.OUTPUT_DESCRIPTOR_V1,
    tags.LEGACY_TAGS.PSBT_V1,
    tags.LEGACY_TAGS.ACCOUNT_V1,
    // Output Descriptors
    tags.TAG_OUTPUT_SCRIPT_HASH,
    tags.TAG_OUTPUT_WITNESS_SCRIPT_HASH,
    tags.TAG_OUTPUT_PUBLIC_KEY,
    tags.TAG_OUTPUT_PUBLIC_KEY_HASH,
    tags.TAG_OUTPUT_WITNESS_PUBLIC_KEY_HASH,
    tags.TAG_OUTPUT_COMBO,
    tags.TAG_OUTPUT_MULTISIG,
    tags.TAG_OUTPUT_SORTED_MULTISIG,
    tags.TAG_OUTPUT_RAW_SCRIPT,
    tags.TAG_OUTPUT_TAPROOT,
    tags.TAG_OUTPUT_COSIGNER,
  ];

  return tagList.map((tag) => {
    const value = Number(tag.value);
    const categoryInfo = tagCategories[value] ?? { category: "Other" };
    return {
      value,
      name: tag.name ?? value.toString(),
      category: categoryInfo.category,
      deprecated: categoryInfo.deprecated,
    };
  });
}

// Build known values data from the @blockchaincommons/known-values bundled registry
function buildKnownValuesData(): KnownValueItem[] {
  const seen = new Set<number>();
  const items: KnownValueItem[] = [];

  for (const [value, rawName] of BUNDLED_REGISTRY) {
    if (seen.has(value)) continue;
    seen.add(value);
    items.push({
      value,
      name: rawName.includes(":") ? rawName.substring(rawName.indexOf(":") + 1) : rawName,
      category: getKnownValueCategory(value),
    });
  }

  return items;
}

// Cached data
let _tagsData: TagItem[] | null = null;
let _knownValuesData: KnownValueItem[] | null = null;

export function useRegistryData() {
  // Lazy initialization
  if (_tagsData === null) {
    _tagsData = buildTagsData();
  }
  if (_knownValuesData === null) {
    _knownValuesData = buildKnownValuesData();
  }

  return {
    tagsData: _tagsData,
    knownValuesData: _knownValuesData,
  };
}
