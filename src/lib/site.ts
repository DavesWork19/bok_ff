export const site = {
  name: "Blackout Kings Fantasy Football",
  shortName: "Blackout Kings",
  tagline: "#touchsomegrass",
  description:
    "Weekly power rankings, bylaws and history of the Blackout Kings fantasy football league.",
  quote: {
    text: "God bless fantasy football. There are many things a man can do with his time… this is better than those things.",
    attribution: "Pete, The League",
  },
  nav: [
    { href: "/rankings", label: "Power Rankings" },
    { href: "/bylaws", label: "Bylaws" },
    { href: "/about", label: "About" },
  ],
};

// Set NEXT_PUBLIC_SITE_URL once a custom domain is attached; until then Vercel's
// production URL is used.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
