// One-off check: does the JSON API accept short template IDs + our dev token?
import crypto from "node:crypto";

const URL = process.env.JSON_API_URL ?? "http://localhost:7575";
const SECRET = "secret";
const LEDGER_ID = "sandbox";
const APP = "mandaterail";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function token(actAs, admin = false) {
  const header = b64({ alg: "HS256", typ: "JWT" });
  const payload = b64({
    "https://daml.com/ledger-api": {
      ledgerId: LEDGER_ID,
      applicationId: APP,
      actAs,
      readAs: actAs,
      admin,
    },
  });
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

async function main() {
  const partiesRes = await fetch(`${URL}/v1/parties`, {
    headers: { Authorization: `Bearer ${token([], true)}` },
  });
  const parties = await partiesRes.json();
  const byName = Object.fromEntries(
    (parties.result ?? []).map((p) => [p.displayName, p.identifier]),
  );
  console.log("parties:", byName);

  const PKG = "0e4847cc3f280ca3bf117b20d265e8c945fa66c2bac418fcb9a1538fc812faeb";
  const T = (mod, ent) => `${PKG}:${mod}:${ent}`;

  async function queryAs(party, templateIds) {
    const r = await fetch(`${URL}/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token([party])}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ templateIds }),
    });
    return r.json();
  }

  const tMandate = T("MandateRail.Mandate", "SpendMandate");
  const asTreasurer = await queryAs(byName["Treasurer"], [tMandate]);
  console.log(
    "Treasurer sees mandate:",
    JSON.stringify(asTreasurer.result?.[0]?.payload ?? asTreasurer.errors ?? null),
  );

  const asSupplier = await queryAs(byName["SupplierA"], [tMandate]);
  console.log(
    "SupplierA sees mandate (should be EMPTY = cap private):",
    JSON.stringify(asSupplier.result ?? asSupplier.errors),
  );
}

main().catch((e) => {
  console.error("verify failed:", e);
  process.exit(1);
});
