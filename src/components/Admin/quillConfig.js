// src/quillConfig.js
import React from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import "react-quill/dist/quill.snow.css";

// =========================
// CUSTOM FONT-SIZE OPTIONS
// =========================
export const QUILL_SIZE_WHITELIST = [
  "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px",
//   "0.75rem", "1rem", "1.25rem", "1.5rem", "1.75rem", "2rem", "2.5rem",
];

// =======================================================
// FIX DUPLICATE FONT-SIZE LABEL: USE CLASS INSTEAD OF STYLE
// =======================================================
const SizeClass = Quill.import("attributors/class/size");
SizeClass.whitelist = QUILL_SIZE_WHITELIST;
Quill.register(SizeClass, true);

// =========================
// QUILL MODULES
// =========================
export const QUILL_MODULES = {
  toolbar: [
    [{ font: [] }, { size: QUILL_SIZE_WHITELIST }], // size dropdown OK
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    ["blockquote", "code-block"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }, { direction: "rtl" }],
    ["link", "image", "video"],
    ["clean"],
  ],
  clipboard: {
    matchVisual: false,
  },
};

// =========================
// QUILL FORMATS
// =========================
export const QUILL_FORMATS = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "blockquote",
  "code-block",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "video",
  "align",
  "direction",
];
