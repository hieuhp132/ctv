const Referral = require("../models/Referral");
const Job = require("../models/Job");
const User = require("../models/User");
const { callSupabaseFunction } = require("../utils/supabaseClient");

exports.downloadCV = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);
    if (!referral || !referral.cvKey) {
      return res.status(404).json({ message: "CV not found" });
    }

    const { data, error } = await supabase.storage
      .from("cvs")
      .download(referral.cvKey);

    if (error) {
      console.error("Supabase download error:", error.message);
      return res.status(500).json({ message: "Download failed", error: error.message });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${referral.cvFileName}"`);
    res.setHeader("Content-Type", data.type);
    res.send(Buffer.from(await data.arrayBuffer()));
  } catch (err) {
    console.error("Error in downloadCV:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Recruiter gửi referral (submit candidate)
exports.createReferral = async (req, res) => {
  try {
    let {
      jobId, adminId, candidateName, email,
      phone, linkedin, portfolio, suitability,
      bonus, message
    } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    /*
    if (new Date(job.deadline) < new Date())
      return res.status(400).json({ message: "Job is closed" });
    */
    if (!adminId) {
      const adminUser = await User.findOne({ role: "admin" }).select("_id");
      if (!adminUser) return res.status(400).json({ message: "No admin available" });
      adminId = adminUser._id;
    }

    const referral = await Referral.create({
      recruiter: req.user.id,
      job: jobId,
      admin: adminId,
      candidateName,
      candidateEmail: email || "",
      candidatePhone: phone || "",
      cvFileName: req.cvInfo?.cvFileName || "",
      cvKey: req.cvInfo?.cvKey || "",
      cvUrl: req.cvInfo?.cvUrl || "",
      linkedin: linkedin || "",
      portfolio: portfolio || "",
      suitability: suitability || "",
      bonus: Number(bonus) || 0,
      message: message || "",
    });
    res.status(201).json(referral);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin xem referral gửi tới mình
exports.getReferrals = async (req, res) => {
  try {
    const { page = 1, limit = 1000, status, jobId, q = "", finalized } = req.query;
    const filter = { admin: req.user.id };

    if (status) filter.status = status;
    if (jobId) filter.job = jobId;
    if (q) filter.candidateName = { $regex: q, $options: 'i' };
    if (req.query.recruiterId) {
      filter.recruiter = req.query.recruiterId;
    }

    if (finalized === "true") filter.finalized = true;
    else if (finalized === "false") filter.finalized = { $ne: true };


    const total = await Referral.countDocuments(filter);
    const referrals = await Referral.find(filter)
      .populate("recruiter job")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const allReferrals = await Referral.find();


    res.json({ items: referrals, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// Recruiter xem referral mình đã gửi
exports.getMyReferrals = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, jobId, q = "", finalized } = req.query;
    const filter = { recruiter: req.user.id };

    if (status) filter.status = status;
    if (jobId) filter.job = jobId;
    if (q) filter.candidateName = { $regex: q, $options: 'i' };

    if (finalized === "true") filter.finalized = true;
    else if (finalized === "false") filter.finalized = { $ne: true };

    const total = await Referral.countDocuments(filter);
    const referrals = await Referral.find(filter)
      .populate("job")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.json({ items: referrals, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Admin cập nhật trạng thái/bonus referral
exports.updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Normalize status
    const status = String(req.body.status || "").toLowerCase();

    const ALLOWED_STATUS = [
      "submitted",
      "under_review",
      "interviewing",
      "offer",
      "hired",
      "onboard",
      "rejected",
    ];

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Parse bonus safely
    let sanitizedBonus = null;
    const bonus = req.body.bonus;

    if (bonus !== undefined && bonus !== null) {
      const parsed = Number(String(bonus).replace(/[, ]/g, ""));
      if (!Number.isFinite(parsed)) {
        return res.status(400).json({ message: "Invalid bonus" });
      }
      sanitizedBonus = parsed;
    }

    const referral = await Referral.findById(id);
    if (!referral) return res.status(404).json({ message: "Referral not found" });

    referral.status = status;
    if (sanitizedBonus !== null) referral.bonus = sanitizedBonus;

    await referral.save();

    return res.json({ success: true, data: referral });

  } catch (err) {
    console.error("🔥 REAL UPDATE ERROR >>>");
    console.error(err);
    console.error(err.stack);
    return res.status(500).json({ message: "Server error" });
  }
}

exports.finalizeReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }
    if (referral.admin.toString() !== adminId) {
        return res.status(403).json({ message: "Not authorized to finalize this referral" });
    }
    if (referral.finalized) {
      return res.status(400).json({ message: "Referral already finalized" });
    }

    // If status is Onboard, process payment
    if (String(referral.status).toLowerCase() === "onboard") {
      const bonusAmount = referral.bonus;
      if (bonusAmount > 0) {
        const admin = await User.findById(adminId);
        const recruiter = await User.findById(referral.recruiter);

        if (!admin || !recruiter) {
          return res.status(404).json({ message: "Admin or Recruiter not found" });
        }

        if (admin.credit < bonusAmount) {
          return res.status(400).json({ message: "Insufficient admin credit" });
        }

        admin.credit -= bonusAmount;
        recruiter.credit += bonusAmount;

        await admin.save();
        await recruiter.save();
      }
    }

    // Mark as finalized
    referral.finalized = true;
    referral.finalizedAt = new Date();
    await delay(5000);
    await referral.save();

    res.json({ success: true, message: "Referral finalized successfully", referral });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Các field được phép update
const ALLOWED_FIELDS = [
  "recruiter",
  "admin",
  "candidateName",
  "candidateEmail",
  "candidatePhone",
  "cvFileName",
  "cvKey",
  "cvUrl",
  "linkedin",
  "portfolio",
  "suitability",
  "status",
  "bonus",
  "message",
  "finalized",
];

// Admin cập nhật referral
exports.updateReferralFields = async (req, res) => {
  try {
    const updates = req.body;
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }

    // Lọc và apply các field hợp lệ
    const fieldsToUpdate = Object.keys(updates).filter((key) =>
      ALLOWED_FIELDS.includes(key)
    );

    if (fieldsToUpdate.length === 0) {
      return res.json({ message: "No valid fields to update", referral });
    }

    fieldsToUpdate.forEach((key) => {
      referral[key] = updates[key];
    });

    const savedReferral = await referral.save();

    res.json({
      message: "Referral updated successfully",
      referral: savedReferral,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.deleteReferral = async (req, res) => {
  try {
    const referral = await Referral.findByIdAndDelete(req.params.id);
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }
    res.json({ message: 'Referral deleted successfully', referral });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
