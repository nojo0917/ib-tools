import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // <-- Here is the magic line that makes our theme provider work!
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./profile/**/*.{js,ts,jsx,tsx,mdx}", // Added this so it styles your profile folder!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;