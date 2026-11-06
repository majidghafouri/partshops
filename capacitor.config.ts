import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ir.partshops.app",
  appName: "PartShop",
  webDir: "public",
  server: {
    url: "https://partshops.ir",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;