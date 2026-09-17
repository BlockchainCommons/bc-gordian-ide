import { Envelope } from "@blockchaincommons/envelope/all";
import { XIDDocument } from "@blockchaincommons/xid";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("app:mounted", () => {
    const out: string[] = [];
    out.push("treeFormat=" + typeof Envelope.prototype.treeFormat);
    try {
      const doc = XIDDocument.random({ genesis: { passphrase: "pw", resolution: "high", date: new Date() } });
      const env = doc.toEnvelope({ privateKeys: "elide", generator: "elide", sign: "inception" });
      const back = XIDDocument.fromEnvelope(env, { verify: "inception" });
      out.push("roundtrip=" + (back.xid.toHex() === doc.xid.toHex()) + " seq=" + back.provenance?.seq);
      out.push("tree=" + env.treeFormat().split("\n").length + "lines");
      out.push("format=" + (env.format().includes("ProvenanceMark(") ? "summarised" : "raw"));
    } catch (e) {
      out.push("error=" + (e instanceof Error ? e.message : String(e)));
    }
    document.title = "PROBE " + out.join(" ");
  });
});
