const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');

router.use(authMiddleware);

router.get('/', can('expense.manage'), expenseController.getExpenses);
router.post('/', can('expense.manage'), expenseController.createExpense);
router.put('/:id', can('expense.manage'), expenseController.updateExpense);
router.delete('/:id', can('expense.manage'), expenseController.deleteExpense);
router.get('/analytics', can('finance.read'), expenseController.getAnalytics);

module.exports = router;
