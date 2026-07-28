const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Dashboard
router.get("/dashboard", adminController.getDashboardStats);

// Customers
router.get("/customers", adminController.getCustomers);
router.post("/customers", adminController.createCustomer);

// Customer profile routes
router.get("/customers/:id", adminController.getCustomerById);
router.put("/customers/:id", adminController.updateCustomer);
router.post("/customers/:id/deposit", adminController.depositToCustomer);
router.post("/customers/:id/withdraw", adminController.withdrawFromCustomer);

// Transactions
router.get("/transactions/:userId", adminController.getUserTransactions);

// Withdrawals
router.get("/withdrawals", adminController.getAllWithdrawals);
router.get("/withdrawals/:userId", adminController.getUserWithdrawals);
router.post("/withdrawals/:id/request", adminController.requestWithdrawal);
router.put("/withdrawals/:id/approve", adminController.approveWithdrawal);
router.put("/withdrawals/:id/reject", adminController.rejectWithdrawal);

// Transfers
router.get("/transfers", adminController.getAllTransfers);
router.get("/transfers/:userId", adminController.getUserTransfers);
router.post("/transfers/:id/request", adminController.requestTransfer);
router.put("/transfers/:id/approve", adminController.approveTransfer);
router.put("/transfers/:id/reject", adminController.rejectTransfer);

module.exports = router;