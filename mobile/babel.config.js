module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
          },
        },
      ],
      "@babel/plugin-transform-class-properties",
      "@babel/plugin-transform-private-methods",
      "@babel/plugin-transform-private-property-in-object",
    ],
  };
};
