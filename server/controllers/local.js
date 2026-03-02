const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { callSupabaseFunction } = require("../utils/supabaseClient"); // chỗ bạn export supabase function
const { logLogin } = require("../utils/authLogger");
const { writeFile, readFile } = require("../utils/fileStore.js");
const { logActivityInternal } = require("./comments.js");
// -------------------- FILE HELPERS --------------------

// -------------------- USERS --------------------
const getUsers = (req, res) => {
    const users = readFile("users.json");
    res.json(users);
};

const getUserById = (req, res) => {
  const { id } = req.params;
  const users = readFile("users.json");
  const user = users.find(u => u._id === id);
  res.json(user);
};

const getProfile = (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    const users = readFile("users.json") || [];

    const user = users.find(
      (u) => String(u._id) === String(id)
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❗ Không nên trả password (nếu có)
    const { password, ...profile } = user;

    res.json(profile);
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserStatus = async (req, res) => {
    try {
        const { userId, newStatus } = req.body;
        
        // Chỉ chấp nhận các trạng thái hợp lệ
        const validStatuses = ["Pending", "Active", "Rejected"];
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }

        const users = readFile("users.json");
        const userIndex = users.findIndex(u => u._id === userId);

        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        // Cập nhật trạng thái
        users[userIndex].status = newStatus;
        users[userIndex].updatedAt = new Date().toISOString();

        writeFile("users.json", users);

        console.log(`User ${userId} status updated to ${newStatus}`);

        res.json({
            success: true,
            message: `Đã cập nhật trạng thái thành ${newStatus}`,
            user: {
                email: users[userIndex].email,
                status: users[userIndex].status
            }
        });

    } catch (err) {
        console.error("Update status error:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const getUserStatus = (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const users = readFile("users.json");
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user"
      });
    }

    // remove password
    const { password, ...userSafe } = user;

    let token = null;

    // ✅ CHỈ CẤP TOKEN KHI ACTIVE
    if (user.status === "Active") {
      token = jwt.sign(
        {
          id: user._id || user.id,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
    }

    // ✅ RESPONSE LUÔN CÙNG FORMAT
    return res.status(200).json({
      success: true,
      status: user.status, // "Active" | "Pending" | "Rejected"
      user: userSafe,
      token // null nếu chưa Active
    });

  } catch (err) {
    console.error("getUserStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
};

const updateBasicInfo = (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      newPassword,
      bankInfo,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    const users = readFile("users.json") || [];

    const index = users.findIndex(
      (u) => String(u._id) === String(id)
    );

    if (index === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[index];

    /* ================= UPDATE BASIC INFO ================= */
    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined) {
      user.email = email;
    }

    if (role !== undefined) {
      user.role = role;
    }

    /* ================= UPDATE PASSWORD ================= */
    // ⚠️ Local demo: plain text (KHÔNG dùng cho production)
    if (newPassword && newPassword.trim()) {
      user.password = newPassword;
    }

    /* ================= UPDATE BANK INFO ================= */
    if (bankInfo && typeof bankInfo === "object") {
      user.bankInfo = {
        ...(user.bankInfo || {}),
        ...bankInfo,
      };
    }

    /* ================= META ================= */
    user.updatedAt = new Date().toISOString();

    users[index] = user;
    writeFile("users.json", users);

    /* ================= RESPONSE (NO PASSWORD) ================= */
    const { password, ...profile } = user;

    res.json({
      success: true,
      user: profile,
    });
  } catch (err) {
    console.error("updateBasicInfo error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// const doLogin = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         console.log('Login attempt:', { email });

//         const users = readFile("users.json");
//         const user = users.find(u => u.email === email);


//         if (!user) {
//             console.log('User not found for login');
//             return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
//         }

//         // --- KIỂM TRA TRẠNG THÁI PHÊ DUYỆT ---
//         if (user.status === "Pending") {
//             return res.status(403).json({ 
//                 success: false, 
//                 message: 'Tài khoản của bạn đang chờ Admin phê duyệt.' 
//             });
//         }
//         if (user.status === "Rejected") {
//             return res.status(403).json({ 
//                 success: false, 
//                 message: 'Tài khoản của bạn đã bị từ chối truy cập.' 
//             });
//         }

//         // Kiểm tra user có password không (Google OAuth only)
//         if (!user.password) {
//             console.log('User exists but has no password (Google OAuth Only)');
//             return res.status(400).json({
//                 success: false,
//                 message: 'Tài khoản này chỉ đăng nhập bằng Google',
//                 code: 'GOOGLE_ONLY_ACCOUNT'
//             });
//         }

//         // So sánh mật khẩu
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             console.log('Password mismatch for login');
//             return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
//         }

//         console.log('Login successful:', user.email);

//         // Tạo JWT token
//         const token = jwt.sign(
//             { id: user._id || user.id, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: '1d' }
//         );

//         // Loại bỏ password trước khi trả về
//         const { password: pwd, ...userSafe } = user;

//         res.json({
//             success: true,
//             message: 'Đăng nhập thành công',
//             user: {
//                 ...userSafe,
//                 token
//             }
//         });

//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ success: false, message: 'Lỗi server' });
//     }
// };

// const doRegister = async (req, res) => {
//     try {
//         const users = readFile("users.json");
//         const { name, email, password, promodeCode, fromSupabase } = req.body;

//         console.log("Register attempt:", { name, email, fromSupabase });

//         // 1. Tìm xem email này đã tồn tại trong hệ thống chưa
//         const existingUser = users.find(u => u.email === email);

//         if (existingUser) {
//             // Trường hợp người dùng đã có mật khẩu (đã đăng ký trước đó)
//             if (existingUser.password) {
//                 if (!fromSupabase) {
//                     // Đăng ký thường bằng Form mà trùng email -> Báo lỗi
//                     return res.status(400).json({
//                         success: false,
//                         message: "Email đã được đăng ký, vui lòng đăng nhập",
//                         code: "EMAIL_EXIST_WITH_PASSWORD"
//                     });
//                 } else {
//                     // Đăng nhập bằng Google mà email đã tồn tại -> Trả về user để FE check status
//                     const { password: p, ...userSafe } = existingUser;
//                     return res.status(200).json({
//                         success: true,
//                         message: "Đăng nhập bằng Gmail (Supabase)",
//                         code: "LOGIN_WITH_EXIST_GMAIL",
//                         user: userSafe // FE sẽ dựa vào userSafe.status để cho vào hoặc chặn
//                     });
//                 }
//             }
//         }

//         // 2. Nếu là người dùng mới hoàn toàn, tiến hành tạo tài khoản
//         // Hash password (nếu có - đăng ký qua form)
//         let hashedPassword = null;
//         if (password) {
//             hashedPassword = await bcrypt.hash(password, 10);
//         }

//         // 3. Khởi tạo Object người dùng mới
//         const newUser = {
//             _id: Date.now().toString(),
//             name: name || "New User",
//             email: email,
//             password: hashedPassword,
//             role: "recruiter",   // Quyền mặc định
//             status: "Pending",   // ❗ QUAN TRỌNG: Mặc định luôn là Chờ duyệt
//             credit: 0,
//             createdAt: new Date().toISOString()
//         };

//         // 4. Lưu vào cơ sở dữ liệu (file JSON)
//         users.push(newUser);
//         writeFile("users.json", users);

//         // 5. Chuẩn bị dữ liệu trả về (loại bỏ password)
//         const { password: pwd, ...userSafe } = newUser;

//         console.log("Register success - User created with Pending status:", userSafe.email);

//         // Trả về code 200 kèm user có status "Pending"
//         res.status(200).json({
//             success: true,
//             message: "Đăng ký thành công, vui lòng đợi Admin phê duyệt",
//             user: userSafe
//         });

//     } catch (err) {
//         console.error("Register error:", err);
//         res.status(500).json({
//             success: false,
//             message: "Lỗi server trong quá trình đăng ký"
//         });
//     }
// };


const doLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readFile("users.json");

    const user = users.find(u => u.email === email);
    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message:
          user.status === "Pending"
            ? "Tài khoản đang chờ phê duyệt"
            : "Tài khoản đã bị từ chối",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...safeUser } = user;
    
    logLogin({
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      user: {
        ...safeUser,
        token,
      },
    });
  } catch (err) {
    console.error("doLogin error:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const doRegister = async (req, res) => {
  try {
    const { name, email, password, fromSupabase } = req.body;
    const users = readFile("users.json");

    const existed = users.find(u => u.email === email);
    if (existed && existed.password && !fromSupabase) {
      return res.status(400).json({
        success: false,
        message: "Email đã tồn tại",
      });
    }

    const hashed = password ? await bcrypt.hash(password, 10) : null;

    const newUser = {
      _id: Date.now().toString(),
      name: name || "New User",
      email,
      password: hashed,
      role: "recruiter",
      status: "Pending",
      credit: 0,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeFile("users.json", users);

    const { password: _, ...safeUser } = newUser;

    res.json({
      success: true,
      message: "Đăng ký thành công, chờ phê duyệt",
      user: safeUser,
    });
  } catch (err) {
    console.error("doRegister error:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, responseWithEmail } = req.body;

    const users = readFile("users.json") || [];

    const index = users.findIndex(
      u => String(u.email).toLowerCase() === String(email).toLowerCase()
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[index].password = hashedPassword;
    users[index].updatedAt = new Date().toISOString();

    writeFile("users.json", users);

    if (responseWithEmail) {
      try {
        await callSupabaseFunction("resetPassword", {
          email,
          password: newPassword,
        });
      } catch (err) {
        console.error("⚠️ Failed to send notification:", err.message);
      }

      return res.json({
        success: true,
        message: "New password sent to your email.",
      });
    }

    return res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });

  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};


const createUser = (req, res) => {
    const users = readFile("users.json");
    const newUser = { _id: Date.now().toString(), ...req.body };
    users.push(newUser);
    writeFile("users.json", users);
    res.json(newUser);
};

const removeUser = (req, res) => {
    const { userId } = req.params;
    let users = readFile("users.json");
    users = users.filter(u => u._id !== userId);
    writeFile("users.json", users);
    res.json({ message: "User removed", userId });
};

// -------------------- JOBS --------------------
const getJobs = (req, res) => {
  try {
    const { savedBy } = req.query;

    let jobs = readFile("jobs.json");

    if (savedBy) {
      jobs = jobs.filter(job =>
        Array.isArray(job.savedBy) &&
        job.savedBy.includes(savedBy)
      );
    }

    res.json({
      success: true,
      jobs
    });
  } catch (err) {
    console.error("getAllJobs error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get jobs"
    });
  }
};

const getJobById = (req, res) => {
    const { id } = req.params;
    const jobs = readFile("jobs.json");

    const job = jobs.find(j => j._id === id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    res.json({ message: "Job found", job });
};

const getJobsByStatus = (req, res) => {
    const { status } = req.params;
    const jobs = readFile("jobs.json");
    const filteredJobs = jobs.filter(j => j.status === status);
    res.json(filteredJobs);
};

const saveJob = (req, res) => {	
  try {
    const jobId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "Missing userId" 
      });
    }

    console.log("Fetching job with ID:", jobId);

    const jobs = readFile("jobs.json");

    // 🔍 Tìm job
    const jobIndex = jobs.findIndex(j => j._id === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }

    const job = jobs[jobIndex];

    console.log("Job before update:", job);
    console.log("Checking savedBy:", job.savedBy);

    // 🧠 Init savedBy nếu chưa có
    if (!Array.isArray(job.savedBy)) {
      job.savedBy = [];
    }

    // ➕ Thêm userId nếu chưa tồn tại
    if (!job.savedBy.includes(userId)) {
      job.savedBy.push(userId);
      console.log("UserId added to savedBy:", userId);
    } else {
      console.log("UserId already exists in savedBy:", userId);
    }

    // 💾 Save lại file
    jobs[jobIndex] = job;
    writeFile("jobs.json", jobs);

    console.log("Job after update:", job);

    res.json({
      success: true,
      job
    });

  } catch (err) {
    console.error("Error in saveJob:", err);
    res.status(400).json({
      success: false,
      message: "Save job failed",
      error: err.message
    });
  }
}

const unsaveJob = (req, res) => {
  try {
    const jobId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId"
      });
    }

    console.log("Un-saving job with ID:", jobId);

    const jobs = readFile("jobs.json");

    // 🔍 Find job
    const jobIndex = jobs.findIndex(j => j._id === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const job = jobs[jobIndex];

    console.log("Job before update:", job);
    console.log("Current savedBy:", job.savedBy);

    // 🧠 Ensure savedBy is an array
    if (!Array.isArray(job.savedBy)) {
      job.savedBy = [];
    }

    // ➖ Remove userId
    const originalLength = job.savedBy.length;
    job.savedBy = job.savedBy.filter(id => id !== userId);

    if (job.savedBy.length < originalLength) {
      console.log("UserId removed from savedBy:", userId);
    } else {
      console.log("UserId not found in savedBy:", userId);
    }

    // 💾 Save file
    jobs[jobIndex] = job;
    writeFile("jobs.json", jobs);

    console.log("Job after update:", job);

    res.json({
      success: true,
      job
    });

  } catch (err) {
    console.error("Error in unsaveJob:", err);
    res.status(400).json({
      success: false,
      message: "Unsave job failed",
      error: err.message
    });
  }
};

const resetJobs = (req, res) => {
    writeFile("jobs.json", []);
    res.json({ message: "Jobs reset successfully" });
};

const createJob = (req, res) => {
  console.log("Body: ", req.body);

  // Đọc dữ liệu cũ
  const jobs = readFile("jobs.json");

  const now = new Date().toISOString(); // Thời gian hiện tại

  const newJob = {
    _id: Date.now().toString(), // tạo id đơn giản từ timestamp
    ...req.body,
    createdAt: now,
    updatedAt: now,
  };

  jobs.push(newJob);

  // Ghi lại file
  writeFile("jobs.json", jobs);

  // Log activity
  const adminName = req.body.adminName || req.user?.name || "Admin";
  logActivityInternal(
    "job_created",
    `${adminName} created job "${newJob.title}"`,
    {
      jobId: newJob._id,
      jobTitle: newJob.title,
      adminName,
      adminRole: "admin"
    }
  );

  res.json(newJob);
};



const updateJob = (req, res) => {
    const { id } = req.params;
	console.log("Body: ", req.body);
	console.log("Params: ", req.params);
	
    const jobs = readFile("jobs.json");

    const index = jobs.findIndex(job => job._id === id);
    if (index === -1) {
        return res.status(404).json({ message: "Job not found" });
    }

    const oldJob = jobs[index];
    const updatedJob = {
        ...jobs[index],
        ...req.body,
        _id: id, // giữ nguyên id
        updatedAt: new Date().toISOString(),
    };

    jobs[index] = updatedJob;
    writeFile("jobs.json", jobs);

    // Log activity
    const adminName = req.body.adminName || req.user?.name || "Admin";
    const changes = [];
    
    // Track what changed
    if (oldJob.title !== updatedJob.title) changes.push(`title: "${oldJob.title}" → "${updatedJob.title}"`);
    if (oldJob.status !== updatedJob.status) changes.push(`status: "${oldJob.status}" → "${updatedJob.status}"`);
    if (oldJob.description !== updatedJob.description) changes.push("description updated");
    
    const changeDetails = changes.length > 0 ? changes.join(", ") : "general update";
    
    logActivityInternal(
      "job_updated",
      `${adminName} updated job "${updatedJob.title}"`,
      {
        jobId: id,
        jobTitle: updatedJob.title,
        adminName,
        adminRole: "admin",
        details: changeDetails
      }
    );

    res.json(updatedJob);
};


const removeJob = (req, res) => {
  const { id } = req.params;

  let jobs = readFile("jobs.json");

  const before = jobs.length;
  
  const removedJob = jobs.find(job => String(job._id) === String(id));

  jobs = jobs.filter(job => {
    // normalize both sides
    const jobId = job._id;
    const paramId = id;

    // case 1: exact match (string-string or number-number)
    if (jobId === paramId) return false;

    // case 2: string vs number (safe compare)
    if (String(jobId) === String(paramId)) return false;

    return true; // keep job
  });

  const removed = before - jobs.length;

  writeFile("jobs.json", jobs);

  // Log activity if job was actually removed
  if (removed && removedJob) {
    const adminName = req.body?.adminName || req.user?.name || "Admin";
    logActivityInternal(
      "job_deleted",
      `${adminName} deleted job "${removedJob.title}"`,
      {
        jobId: id,
        jobTitle: removedJob.title,
        adminName,
        adminRole: "admin"
      }
    );
  }

  res.json({
    message: removed ? "Job removed" : "Job not found",
    id,
    removed,
  });
};


// -------------------- REFERRALS --------------------
const getReferrals = (req, res) => {
  try {
    const {
      id,
      email,
      isAdmin,
      page = 1,
      limit = 50,
      status,
      jobId,
      q = "",
      finalized,
    } = req.query;

    /* console.log("Query:", req.query); */

    if (!id || isAdmin === undefined) {
      return res.status(400).json({
        message: "id & isAdmin are required",
      });
    }

    const isAdminBool = isAdmin === "true";
    const referrals = readFile("referrals.json") || [];

    const requesterId = String(id).toLowerCase();
    const requesterEmail = email
      ? String(email).toLowerCase()
      : null;

    let filtered = referrals.filter((ref) => {
      /* ===== OWNER FILTER ===== */
      if (isAdminBool) {
        // ADMIN: chỉ match theo admin id
        if (!ref.admin) return false;
        return String(ref.admin).toLowerCase() === requesterId;
      } else {
        // RECRUITER: match theo id OR email
        if (!ref.recruiter) return false;

        const recruiterValue = String(ref.recruiter).toLowerCase();

        const matchById = recruiterValue === requesterId;
        const matchByEmail =
          requesterEmail && recruiterValue === requesterEmail;

        if (!matchById && !matchByEmail) return false;
      }

      /* ===== COMMON FILTERS ===== */
      if (status && ref.status !== status) return false;
      if (jobId && ref.job !== jobId) return false;

      if (
        q &&
        !ref.candidateName?.toLowerCase().includes(q.toLowerCase()) &&
        !ref.candidateEmail?.toLowerCase().includes(q.toLowerCase())
      ) {
        return false;
      }

      if (finalized === "true" && ref.finalized !== true) return false;
      if (finalized === "false" && ref.finalized === true) return false;

      return true;
    });

    /* ===== SORT + PAGINATION ===== */
    filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const total = filtered.length;
    const start = (Number(page) - 1) * Number(limit);
    const items = filtered.slice(start, start + Number(limit));

    res.json({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error("getReferrals error:", err);
    res.status(500).json({ message: "Server error" });
  }
};




const resetReferrals = (req, res) => {
    writeFile("referrals.json", []);
    res.json({ message: "Referrals reset successfully" });
};

const createReferral = (req, res) => {
  try {
    let {
      jobId,
      recruiterId,
      adminId,
      candidateName,
      email,
      phone,
      linkedin,
      portfolio,
      suitability,
      bonus,
      message,
      cvUrl
    } = req.body;

    if (!jobId || !recruiterId || !candidateName) {
      return res.status(400).json({
        message: "jobId, recruiterId, candidateName are required"
      });
    }

    /* ===== LOAD JOB ===== */
    const jobs = readFile("jobs.json") || [];
    const job = jobs.find(j => String(j._id) === String(jobId));
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    /* ===== AUTO ADMIN (LOCAL) ===== */
    if (!adminId) {
      const users = readFile("users.json") || [];
      const adminUser = users.find(u => u.role === "admin");
      adminId = adminUser?._id || "admin";
    }

    /* ===== CREATE REFERRAL ===== */
    const referrals = readFile("referrals.json") || [];

    const referral = {
      _id: Date.now().toString(),

      recruiter: recruiterId,
      admin: adminId,
      job: jobId,

      candidateName,
      candidateEmail: email || "",
      candidatePhone: phone || "",

      cvUrl: cvUrl || "",

      linkedin: linkedin || "",
      portfolio: portfolio || "",
      suitability: suitability || "",

      bonus: Number(bonus) || 0,
      message: message || "",

      status: "submitted",
      createdAt: new Date().toISOString(),
    };

    referrals.push(referral);
    writeFile("referrals.json", referrals);

    // Log activity
    const recruiterName = req.body.recruiterName || "Recruiter";
    logActivityInternal(
      "referral_created",
      `${recruiterName} submitted referral for "${candidateName}" on job "${job.title}"`,
      {
        referralId: referral._id,
        jobId,
        candidateName,
        recruiterName,
        recruiterRole: "recruiter"
      }
    );

    res.status(201).json(referral);
  } catch (err) {
    console.error("createReferral local error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

// Xóa referral
const removeReferral = (req, res) => {
  const { id } = req.params;
  let referrals = readFile("referrals.json");
  const found = referrals.find(r => r._id === id);
  if (!found) return res.status(404).json({ message: "Referral not found" });

  referrals = referrals.filter(r => r._id !== id);
  writeFile("referrals.json", referrals);

  // Log activity
  const adminName = req.body?.adminName || req.user?.name || "Admin";
  logActivityInternal(
    "referral_deleted",
    `${adminName} deleted referral for "${found.candidateName}"`,
    {
      referralId: id,
      candidateName: found.candidateName,
      adminName,
      adminRole: "admin"
    }
  );

  res.json({ message: "Referral removed", id });
};

const updateReferral = (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  let referrals = readFile("referrals.json");
  const index = referrals.findIndex(r => r._id === id);
  if (index === -1) return res.status(404).json({ message: "Referral not found" });

  const oldReferral = referrals[index];
  referrals[index] = { ...referrals[index], ...updates, updatedAt: new Date().toISOString() };
  writeFile("referrals.json", referrals);

  // Log activity
  const adminName = req.body?.adminName || req.user?.name || "Admin";
  const changes = [];
  
  // Track what changed
  if (oldReferral.status !== referrals[index].status) {
    changes.push(`status: "${oldReferral.status}" → "${referrals[index].status}"`);
  }
  if (oldReferral.suitability !== referrals[index].suitability) {
    changes.push(`suitability: "${oldReferral.suitability}" → "${referrals[index].suitability}"`);
  }
  
  const changeDetails = changes.length > 0 ? changes.join(", ") : "general update";
  
  logActivityInternal(
    "referral_updated",
    `${adminName} updated referral for "${referrals[index].candidateName}"`,
    {
      referralId: id,
      candidateName: referrals[index].candidateName,
      adminName,
      adminRole: "admin",
      details: changeDetails
    }
  );

  res.json({ message: "Referral updated", referral: referrals[index] });
};

// -------------------- EXPORT --------------------
module.exports = {
    // Users
    getUsers, getUserById, getProfile,
    resetPassword, updateBasicInfo,
    createUser,
    removeUser,
    doLogin,
    doRegister,
    // Jobs
    getJobs,
    resetJobs,
    getJobById, saveJob, unsaveJob,
    getJobsByStatus, 
    createJob, updateJob,
    removeJob, updateUserStatus, getUserStatus,
    // Referrals
    getReferrals,
    resetReferrals,
    createReferral,
    removeReferral, updateReferral,
    // Generic file helpers
    readFile,
    writeFile
};
