
export function cleanJobHtml(html) {
    if (!html) return "";
  
    let cleaned = html;
  
    // 1. Convert &nbsp; thành space bình thường
    cleaned = cleaned.replace(/&nbsp;/g, " ");
  
    // 2. Xóa <p> rỗng
    cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");
  
    // 3. Xóa <p> chỉ chứa space
    cleaned = cleaned.replace(/<p>\s+<\/p>/g, "");
  
    // 4. Gộp paragraph bị tách lỗi
    cleaned = cleaned.replace(/<\/p>\s*<p>/g, "</p><p>");
  
    // 5. Xóa nhiều space liên tiếp
    cleaned = cleaned.replace(/\s{2,}/g, " ");
  
    // 6. Trim đầu cuối
    cleaned = cleaned.trim();
  
    return cleaned;
  }