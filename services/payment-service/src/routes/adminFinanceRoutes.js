import express from "express";
import {
  getFinanceSummary,
  getTransactions,
  getTransactionById,
  getFailedPayments
} from "../controllers/paymentAdminController.js";

const router = express.Router();

router.get("/summary", getFinanceSummary);
router.get("/transactions", getTransactions);
router.get("/transactions/:id", getTransactionById);
router.get("/failed-payments", getFailedPayments);

export default router;