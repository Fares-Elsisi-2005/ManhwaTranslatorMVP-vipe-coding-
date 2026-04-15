import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import episodesRouter from "./episodes.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/episodes", episodesRouter);

export default router;
