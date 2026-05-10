import { Router } from "express"
import authRouter from "./auth.js"
import habitsRouter from "./habits.js"
import tasksRouter from "./tasks.js"
import dashboardRouter from "./dashboard.js"
import profileRouter from "./profile.js"

const router = Router()

router.use("/auth", authRouter)
router.use("/habits", habitsRouter)
router.use("/tasks", tasksRouter)
router.use("/dashboard", dashboardRouter)
router.use("/profile", profileRouter)

export default router
