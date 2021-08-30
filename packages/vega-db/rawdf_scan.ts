export default function (df) {
  for (var idx in df.operators) {
    if (df.operators[idx].type === "filter") {
      df.operators[idx].params.expr_str = df.operators[idx].params.expr.$expr.code
    }

    else if (df.operators[idx].type === "stack") {
      df.operators[idx].params.order = df.operators[idx].params.sort.$order
    }
  }
}