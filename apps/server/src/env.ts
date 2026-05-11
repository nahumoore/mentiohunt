import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

config({ path: [resolve(serverRoot, ".env.local"), resolve(serverRoot, ".env")] })
