import express, { Request, Response, NextFunction } from "express"
import { runMigrations } from "./db/migrate.js"
import router from "./routes/index.js"

const app = express()

app.use(express.json())

await runMigrations()

app.use("/api", router)

app.get("/", (_req: Request, res: Response) => {
  res.json({ success: true, message: "Agent Skills Sandbox API" })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: err.message || "Internal server error" })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
