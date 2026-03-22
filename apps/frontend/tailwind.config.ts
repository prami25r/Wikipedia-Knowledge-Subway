import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        subway: {
          bg: "#0f172a",
          panel: "#111827",
          accent: "#06b6d4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
