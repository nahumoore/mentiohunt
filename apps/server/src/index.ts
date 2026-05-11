import express from "express"
import "./env.js"
import { directoryOpportunitiesRouter } from "./routes/find-directory-opportunities.js"

const app = express()
const PORT = process.env.PORT || 3001
const isDev =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev"

app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

if (isDev) {
  app.use(directoryOpportunitiesRouter)
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
