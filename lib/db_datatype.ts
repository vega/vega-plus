export default function arrow(data) {
  const table = arrowTable(data);
  const proxy = rowProxy(table);
  const rows = Array(table.length);

  for (let i = 0, n = rows.length; i < n; ++i) {
    rows[i] = proxy(i);
  }

  return rows;
}

arrow.responseType = 'arrayBuffer';