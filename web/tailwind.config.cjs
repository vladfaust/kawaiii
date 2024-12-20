const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        base: colors.slate,
        primary: colors.blue,
        secondary: colors.purple,
        accent: colors.pink,
        info: colors.cyan,
        warn: colors.orange,
        error: colors.red,
        success: colors.green,
      },
      animation: {
        "bg-position": "bg-position 4s ease infinite",
      },
      keyframes: {
        "bg-position": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      fontFamily: {
        sans: ["Nunito", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  separator: "_",
  plugins: [
    function ({ addVariant }) {
      addVariant("child", "& > *");
      addVariant("child-hover", "& > *:hover");
    },
  ],
};
