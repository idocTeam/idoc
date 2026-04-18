import Payment from "../models/Payment.js";

const buildBaseFilter = (query = {}) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.doctorId) {
    filter.doctorId = query.doctorId;
  }

  if (query.excludeTests !== "false") {
    filter.isTest = { $ne: true };
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};

    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  return filter;
};

export const getFinanceSummary = async (_req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const baseCompleted = { status: "completed", isTest: { $ne: true } };

    const [
      totalRevenueAgg,
      todayRevenueAgg,
      monthlyRevenueAgg,
      completedCount,
      pendingCount,
      failedCount
    ] = await Promise.all([
      Payment.aggregate([
        { $match: baseCompleted },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        {
          $match: {
            ...baseCompleted,
            paidAt: { $gte: startOfToday }
          }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        {
          $match: {
            ...baseCompleted,
            paidAt: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Payment.countDocuments({ status: "completed", isTest: { $ne: true } }),
      Payment.countDocuments({ status: "pending", isTest: { $ne: true } }),
      Payment.countDocuments({ status: "failed", isTest: { $ne: true } })
    ]);

    res.status(200).json({
      summary: {
        totalRevenue: totalRevenueAgg[0]?.total || 0,
        todayRevenue: todayRevenueAgg[0]?.total || 0,
        monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
        completedCount,
        pendingCount,
        failedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load finance summary",
      error: error.message
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;

    const filter = buildBaseFilter(req.query);

    const [transactions, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(filter)
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load transactions",
      error: error.message
    });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Payment.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load transaction",
      error: error.message
    });
  }
};

export const getFailedPayments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;

    const filter = {
      ...buildBaseFilter(req.query),
      status: "failed"
    };

    const [transactions, total] = await Promise.all([
      Payment.find(filter).sort({ failedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(filter)
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load failed payments",
      error: error.message
    });
  }
};