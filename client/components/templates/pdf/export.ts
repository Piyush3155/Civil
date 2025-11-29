import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
/** Load font from /public/fonts folder */
async function loadFontBase64(path: string) {
  const res = await fetch(path);
  const buffer = await res.arrayBuffer();

  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

/** Register Poppins in jsPDF */
async function registerFonts(doc: jsPDF) {
  const PoppinsRegular = await loadFontBase64("/fonts/Poppins-Regular.ttf");
  const PoppinsBold = await loadFontBase64("/fonts/Poppins-Bold.ttf");

  doc.addFileToVFS("Poppins-Regular.ttf", PoppinsRegular);
  doc.addFileToVFS("Poppins-Bold.ttf", PoppinsBold);

  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
  doc.addFont("Poppins-Bold.ttf", "Poppins", "bold");
}

/** Export to PDF */
export async function exportToPDF(
  fileName: string,
  headers: string[],
  rows: (string | number)[][],
  title?: string
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Load fonts
  await registerFonts(doc);

  // Fetch organization
  /* ---------------- HEADER ---------------- */
  const logoW = 60;
  const logoH = 60;

  doc.addImage("/images/attar-logo.png", "PNG", margin, 25, logoW, logoH);

  doc.setFont("Poppins", "bold");
  doc.setFontSize(14);

  doc.setFont("Poppins", "normal");
  doc.setFontSize(9);
  doc.text("STEEL STRUCTURE SPECIALISTS", margin + 75, 50);
  doc.text("ISO 9001:2015 CERTIFIED COMPANY", margin + 75, 63);

  const infoX = pageWidth - margin - 220;
  doc.text("www.attarpeb.com", infoX, 63);

  // bottom line
  doc.line(margin, 105, pageWidth - margin, 105);

  // Title
  if (title) {
    doc.setFont("Poppins", "bold");
    doc.setFontSize(14);
    doc.text(title, pageWidth / 2, 125, { align: "center" });
  }

  /* ---------------- TABLE ---------------- */
  autoTable(doc, {
    startY: title ? 150 : 120,
    head: [headers],
    body: rows,

    theme: "striped",
    styles: {
      font: "Poppins",
      fontSize: 9,
      cellPadding: 4,
    },

    headStyles: {
      fillColor: [52, 73, 94],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },

    alternateRowStyles: { fillColor: [245, 245, 245] },

    didDrawPage: (data) => {
      const totalPages = doc.internal.pages.length;
      doc.setFontSize(9);
      doc.setTextColor(100);

      doc.text(
        `Page ${data.pageNumber} of ${totalPages}`,
        pageWidth - 60,
        doc.internal.pageSize.getHeight() - 20
      );
    },
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  doc.save(`${fileName}_${timestamp}.pdf`);
}
