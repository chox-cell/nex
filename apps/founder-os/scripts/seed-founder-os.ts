import { ensureNexSeed } from "../src/lib/nex-runtime";

async function main() {
  const seed = await ensureNexSeed();

  console.log(
    JSON.stringify(
      {
        status: "seeded",
        ...seed,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
