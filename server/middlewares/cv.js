const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Dùng memory storage để lấy buffer
const upload = multer({ storage: multer.memoryStorage() });

const uploadCV = [
  upload.single("cv"),
  async (req, res, next) => {
    try {
      if (!req.file) return next(); // không có file thì bỏ qua

      const fileName = req.file.originalname;
      const fileKey = `${Date.now()}_${fileName}`;

      // Upload vào bucket "cvs"
      const { error } = await supabase.storage
        .from("cvs")
        .upload(fileKey, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) {
        console.error("Supabase upload error:", error.message);
        return res.status(500).json({ message: "CV upload failed", error: error.message });
      }

      // Lấy public URL
      const { data } = supabase.storage.from("cvs").getPublicUrl(fileKey);

      req.cvInfo = {
        cvFileName: fileName,
        cvKey: fileKey,
        cvUrl: data.publicUrl,
      };

      next();
    } catch (err) {
      console.error("UploadCV middleware error:", err);
      res.status(500).json({ message: "CV upload failed", error: err.message });
    }
  },
];

module.exports = uploadCV;
