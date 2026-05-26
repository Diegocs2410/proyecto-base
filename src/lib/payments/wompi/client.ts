export type WompiEnv = "sandbox" | "production";

export interface WompiConfig {
  env: WompiEnv;
  publicKey: string;
  privateKey: string;
  eventsSecret: string;
  integritySecret: string;
  checkoutBaseUrl: string;
  apiBaseUrl: string;
}

export function getWompiConfig(): WompiConfig {
  const env = (process.env.WOMPI_ENV ?? "sandbox") as WompiEnv;
  const publicKey = process.env.WOMPI_PUBLIC_KEY ?? "";
  const privateKey = process.env.WOMPI_PRIVATE_KEY ?? "";
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET ?? "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";

  return {
    env,
    publicKey,
    privateKey,
    eventsSecret,
    integritySecret,
    checkoutBaseUrl: "https://checkout.wompi.co/p/",
    apiBaseUrl:
      env === "production" ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1",
  };
}

export function isWompiConfigured(): boolean {
  const cfg = getWompiConfig();
  return Boolean(cfg.publicKey && cfg.integritySecret && cfg.eventsSecret);
}
