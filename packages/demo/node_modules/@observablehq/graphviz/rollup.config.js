import {terser} from "rollup-plugin-terser";

export default [
  {
    input: "index.js",
    output: {
      extend: true,
      banner: `// @observablehq/graphviz Copyright ${(new Date).getFullYear()} Observable, Inc.
// Viz.js Copyright 2014-2018 Michael Daines`,
      file: "dist/graphviz.js",
      format: "umd",
      name: "O"
    }
  },
  {
    input: "index.js",
    plugins: [
      terser({
        output: {
          preamble: `// @observablehq/graphviz Copyright ${(new Date).getFullYear()} Observable, Inc.
// Viz.js Copyright 2014-2018 Michael Daines`
        }
      })
    ],
    output: {
      extend: true,
      file: "dist/graphviz.min.js",
      format: "umd",
      name: "O"
    }
  }
];
