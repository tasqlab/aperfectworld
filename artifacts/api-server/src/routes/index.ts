import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import charactersRouter from "./characters.js";
import inventoryRouter from "./inventory.js";
import worldRouter from "./world.js";
import placesRouter from "./places.js";
import questsRouter from "./quests.js";
import shopsRouter from "./shops.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/characters", charactersRouter);
router.use("/characters/:characterId/inventory", inventoryRouter);
router.use("/world", worldRouter);
router.use("/places", placesRouter);
router.use("/quests", questsRouter);
router.use("/shops", shopsRouter);

export default router;
