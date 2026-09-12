import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolingDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(toolingDirectory, "..", "..");
const docsDirectory = resolve(repositoryRoot, "docs");
const masterPath = resolve(docsDirectory, "DAYFORGE_MASTER_SPEC.md");
const canonicalPattern = /^\d{2}_[A-Z0-9_]+\.md$/;
const header = [
  "<!-- GENERATED FILE: edit the numbered documents in docs/ and run npm.cmd run docs:master. -->",
  "# Dayforge 2.0 — Master Spec derivado",
  "",
  "> Este arquivo é uma compilação gerada. Os arquivos numerados em `docs/` são a fonte canônica.",
].join("\n");

const filenames = (await readdir(docsDirectory))
  .filter((filename) => canonicalPattern.test(filename))
  .sort();

if (filenames.length === 0) {
  throw new Error("Nenhum documento canônico numerado foi encontrado.");
}

const sections = await Promise.all(
  filenames.map(async (filename) => {
    const content = await readFile(resolve(docsDirectory, filename), "utf8");
    return content.replace(/\r\n/g, "\n").trimEnd();
  }),
);
const generated = `${header}\n\n${sections.join("\n\n---\n\n")}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(masterPath, "utf8").catch(() => "");
  if (current.replace(/\r\n/g, "\n") !== generated) {
    console.error("docs/DAYFORGE_MASTER_SPEC.md está desatualizado. Execute npm.cmd run docs:master.");
    process.exitCode = 1;
  }
} else {
  await writeFile(masterPath, generated, "utf8");
  console.log(`Master gerado a partir de ${filenames.length} documentos canônicos.`);
}
