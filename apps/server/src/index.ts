import express from "express"
import "./env.js"
import { listingsRouter } from "./routes/listings.js"

const app = express()
const PORT = process.env.PORT || 3001
const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev"

app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

if (isDev) {
  app.use(listingsRouter)
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
