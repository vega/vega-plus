# @observablehq/graphviz

Convenience methods for using [Graphviz](http://www.graphviz.org/) in [Observable](https://observablehq.com). See this notebook for examples:

https://beta.observablehq.com/@mbostock/graphviz

To load Graphviz:

```js
dot = require("@observablehq/graphviz")
```

To display a happy little diagram:

```js
dot`graph { n0 -- n1 -- n2 -- n3 -- n0; }`
```
