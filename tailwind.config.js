const colors = require('tailwindcss/colors')

module.exports = {
  content: ["./views/*.ejs"],
  theme: {
    extend: {
      colors: {
        blue: colors.cyan,
        gray: colors.slate,
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
