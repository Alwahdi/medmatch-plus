import { createServerFn } from "@tanstack/react-start";

/** Tells the UI whether the email / WhatsApp providers are configured yet. */
export const getChannelStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { channelStatus } = await import("./notify.server");
  return channelStatus();
});
