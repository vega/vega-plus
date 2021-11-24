import {render, Module} from "./viz-lite.render.js";

const defaults = {files: [], format: "svg", engine: "dot"};

function Dot(options) {
  options = Object.assign({}, defaults, options);
  let module = Module(Object.assign({}, options));
  return function dot(strings) {
    let string = strings[0] + "", i = 0, n = arguments.length;
    while (++i < n) string += arguments[i] + "" + strings[i];
    const template = document.createElement("template");
    try {
      template.innerHTML = render(module, string, options);
    } catch (error) {
      module = Module(Object.assign({}, options)); // See Viz.js caveats.
      throw error;
    }
    const svg = document.importNode(template.content.firstElementChild, true);
    svg.style.maxWidth = "100%";
    svg.style.height = "auto";
    return svg;
  };
}

const dot = Dot({});
dot.options = Dot;
export default dot;
