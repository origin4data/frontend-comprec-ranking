// A mesma configuração do frontend-plataforma-comprec, para os dois repositórios não divergirem:
// quem passa de um para o outro não deveria precisar reaprender o estilo.
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  arrowParens: "always",
  endOfLine: "lf",
  plugins: ["prettier-plugin-tailwindcss"],

  tailwindConfig: "./tailwind.config.ts",
};

export default config;
