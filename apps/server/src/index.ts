import express from "express"
import "./env.js"
import { registerRoutes } from "./routes/index.js"

const app = express()
const PORT = process.env.PORT || 3001
const isDev =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev"

app.use(
  express.json({
    verify: (req, _res, buf) => {
      ;(req as express.Request & { rawBody: string }).rawBody = buf.toString("utf8")
    },
  })
)

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

registerRoutes(app, isDev)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)

  if (!isDev) {
    // registerJobs()
  }
})
