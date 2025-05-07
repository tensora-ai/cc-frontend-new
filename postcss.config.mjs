const config = {
  plugins: {
    '@tailwindcss/postcss': {
      theme: {
        colors: {
          tensora: {
            light: "#8C8FC0",   // Light purple
            medium: "#5B5E96",  // Medium purple
            dark: "#1D1B44",    // Dark purple (this should now be visible)
            text: "#000000",    // Black for text
          },
        },
        // Other theme configurations can go here
      },
    },
  },
};

export default config;
