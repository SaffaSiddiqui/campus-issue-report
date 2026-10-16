import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          500: "#2f6fed",
          600: "#2158d1",
          700: "#1c46a8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
