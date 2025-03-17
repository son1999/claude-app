/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#5E35B1",
        secondary: "#009688",
        accent: "#FF4081",
        "code-bg": "#282c34",
        "code-text": "#abb2bf",
        "code-keyword": "#c678dd",
        "code-string": "#98c379",
        "code-number": "#d19a66",
        "code-comment": "#7f848e",
      },
    },
  },
  plugins: [],
};
