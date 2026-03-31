const {supabase, callSupabaseFunction} = require('../utils/supabaseClient');
const fs = require('fs');
const path = require('path');
const bucketName = 'files';

// exports.uploadFile = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ success: false, error: "No file uploaded" });
//         }

//         const fileBuffer = req.file.buffer;
//         const originalName = req.file.originalname;
//         const contentType = req.file.mimetype;
//         const fileNameOnSupabase = `jd_${Date.now()}_${originalName}`;

//         const { data, error } = await supabase.storage
//             .from(bucketName)
//             .upload(fileNameOnSupabase, fileBuffer, {
//                 contentType,
//                 upsert: true,
//             });

//         if (error) {
//             return res.status(500).json({ success: false, error: error.message });
//         }

//         const { data: publicData } = supabase.storage
//             .from(bucketName)
//             .getPublicUrl(fileNameOnSupabase);

//         return res.status(200).json({
//             success: true,
//             file: data,
//             publicUrl: publicData.publicUrl,
//         });

//     } catch (err) {
//         return res.status(500).json({ success: false, error: err.message });
//     }
// };

exports.uploadFile = async (req, res) => {
  try {
    console.log("====== UPLOAD DEBUG START ======");

    // 1. Check env
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
    console.log("BUCKET:", bucketName);

    // 2. Check file từ multer
    console.log("REQ.FILE:", req.file);

    if (!req.file) {
      console.log("❌ No file in request");
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    const contentType = req.file.mimetype;

    console.log("File name:", originalName);
    console.log("Content type:", contentType);
    console.log("Buffer size:", fileBuffer?.length);

    if (!fileBuffer) {
      console.log("❌ Buffer is undefined");
      return res.status(400).json({ error: "File buffer missing (multer config issue)" });
    }

    // 3. Generate filename
    const fileNameOnSupabase = `jd_${Date.now()}_${originalName}`;
    console.log("Uploading as:", fileNameOnSupabase);

    // 4. Upload
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileNameOnSupabase, fileBuffer, {
        contentType,
        upsert: true,
      });

    console.log("UPLOAD DATA:", data);
    console.log("UPLOAD ERROR:", error);

    if (error) {
      console.log("❌ Upload failed");
      return res.status(500).json({ success: false, error: error.message });
    }

    // 5. Get public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileNameOnSupabase);

    console.log("Public URL:", publicData.publicUrl);

    console.log("====== UPLOAD DEBUG END ======");

    return res.status(200).json({
      success: true,
      file: data,
      publicUrl: publicData.publicUrl,
    });

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};


exports.downloadFile = async (req, res) => {

    try {
        
        const {filename} = req.params;
        if(!filename) return res.status(400).json({ error: 'filename is required' });
        
        const { data, error } = await supabase.storage.from(bucketName).download(filename);
        if(error) return res.status(500).json({ error: error.message });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return data.pipe(res);
    } catch(err) {
        return res.status(500).json({ error: err.message })
    }
}

exports.deleteFile = async (req, res) => {
    
    try {
        const { filename } = req.params;
        console.log('Request params:', filename);
        if(!filename) return res.status(400).json({ error: 'Filename is required' });

        const {data, error} = await supabase.storage.from(bucketName).remove([filename]);
        if(error) return res.status(500).json({ error: error.message });

        return res.status(200).json({ success: true, message: "File deleted", data });
    } catch(err) {
        return res.status(500).json({ error: err.message });
    }
}

exports.listFiles = async (req, res) => {

    const {data, error} = await supabase.storage.from('files').list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc'}
    });

    if(error) return res.status(500).json({ error: error.message });
    res.json({ files: data });
}

exports.debugListAllFiles = async (req, res) => {
  try {
    console.log("====== LIST FILES DEBUG ======");

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    console.log("FILES:", data);
    console.log("ERROR:", error);

    return res.json({
      success: true,
      total: data?.length,
      files: data,
    });

  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.debugUploadLocal = async (req, res) => {
  try {
    console.log("====== DEBUG LOCAL UPLOAD ======");

    const fileBuffer = fs.readFileSync("./test.pdf");

    const fileName = `test_${Date.now()}.pdf`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
      });

    console.log("UPLOAD DATA:", data);
    console.log("UPLOAD ERROR:", error);

    return res.json({ data, error });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.signup = async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: "Email và tên là bắt buộc" });
      }
      const result = await callSupabaseFunction('signup', { email, name });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

function generateRandomPassword(len) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for(let i = 0; i < len; i++){
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

exports.forgotPassword = async (req, res) => {
    const password = generateRandomPassword(10);
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email là bắt buộc" });
        }
        const result = await callSupabaseFunction('resetPassword', { email, password });
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.updateStatus = async (req, res) => {
    try {
      const { email, status } = req.body;
  
      if (!email || !status) {
        return res.status(400).json({ error: "Email và trạng thái là bắt buộc" });
      }
  
      // Gọi Supabase Edge Function (đã setup trong utils/supabaseClient.js)
      const result = await callSupabaseFunction("updateStatus", { email, status });
  
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error("Error in updateStatus:", err.message);
      return res.status(500).json({ error: err.message });
    }
  };
  

module.exports = {
  uploadFile: exports.uploadFile,
  downloadFile: exports.downloadFile,
  deleteFile: exports.deleteFile,
  listFiles: exports.listFiles,
  debugListAllFiles: exports.debugListAllFiles,
  debugUploadLocal: exports.debugUploadLocal,
  signup: exports.signup,
  forgotPassword: exports.forgotPassword,
  updateStatus: exports.updateStatus,
};