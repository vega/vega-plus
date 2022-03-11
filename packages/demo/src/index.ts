import "regenerator-runtime/runtime";
import pkg from "../package.json";

export * from "./db";

export const version = pkg.version;
