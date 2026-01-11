import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Configuration Constants ---
const COLORS = {
  PRIMARY: [41, 128, 185] as [number, number, number],      // Professional Blue
  TEXT: [60, 60, 60] as [number, number, number],           // Dark Grey
  TEXT_LIGHT: [100, 100, 100] as [number, number, number],  // Light Grey
  LINE: [200, 200, 200] as [number, number, number],        // Border Grey
  TABLE_HEADER: [41, 128, 185] as [number, number, number],
  TABLE_ALT_ROW: [249, 250, 251] as [number, number, number],
  WHITE: [255, 255, 255] as [number, number, number],
  SUCCESS: [34, 197, 94] as [number, number, number],
};

const LAYOUT = {
  MARGIN: 40,
  TOP_PADDING: 30,
  HEADER_HEIGHT: 95,
};

export interface PurchaseOrderItem {
  material: { name: string; unit: string };
  quantity: number;
  unitPrice: number;
  amount: number;
  notes?: string;
}

export interface PurchaseOrderPDFData {
  poNumber: string;
  createdAt: string;
  status: string;
  project: { name: string };
  supplier: { name: string; email?: string; phone?: string; address?: string };
  deliveryAddress?: string;
  paymentTerms?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  taxAmount?: number;
  grandTotal: number;
  notes?: string;
}

export class PurchaseOrderPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;

  constructor() {
    this.doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "A4" });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  generatePDF(purchaseOrder: PurchaseOrderPDFData): jsPDF {
    this.addHeader(purchaseOrder);
    this.addInfoSection(purchaseOrder);
    this.addItemsTable(purchaseOrder);
    this.addTotalsSection(purchaseOrder);
    this.addNotesSection(purchaseOrder);
    this.addFooter();
    return this.doc;
  }

  private addHeader(purchaseOrder: PurchaseOrderPDFData): void {
    // Company Name (Left Side)
    let currentY = LAYOUT.TOP_PADDING + 15;
    
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(18);
    this.doc.setTextColor(...COLORS.PRIMARY);
    this.doc.text("CIVIL DESK", LAYOUT.MARGIN, currentY);

    // Tagline
    currentY += 16;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.TEXT);
    this.doc.text("Building Excellence, Delivering Quality", LAYOUT.MARGIN, currentY);

    // Address
    currentY += 14;
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.TEXT_LIGHT);
    this.doc.text("Professional Construction Management Solutions", LAYOUT.MARGIN, currentY);

    // Right Side - PO Details
    const rightTextX = this.pageWidth - LAYOUT.MARGIN;
    let rightTextY = LAYOUT.TOP_PADDING + 10;

    // PO Title
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(...COLORS.PRIMARY);
    this.doc.text("PURCHASE ORDER", rightTextX, rightTextY, { align: "right" });

    // PO Number
    rightTextY += 22;
    this.doc.setFontSize(11);
    this.doc.setTextColor(...COLORS.TEXT);
    this.doc.text(`PO #: ${purchaseOrder.poNumber}`, rightTextX, rightTextY, { align: "right" });

    // Date
    rightTextY += 14;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.text(`Date: ${new Date(purchaseOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, rightTextX, rightTextY, { align: "right" });

    // Status Badge
    // rightTextY += 16;
    // const statusText = purchaseOrder.status.replace(/_/g, ' ');
    // const statusWidth = this.doc.getTextWidth(statusText) + 16;
    
    // this.doc.setFillColor(...COLORS.PRIMARY);
    // this.doc.roundedRect(rightTextX - statusWidth, rightTextY - 10, statusWidth, 16, 3, 3, 'F');
    // this.doc.setFont("helvetica", "bold");
    // this.doc.setFontSize(8);
    // this.doc.setTextColor(...COLORS.WHITE);
    // this.doc.text(statusText, rightTextX - statusWidth / 2, rightTextY - 1, { align: "center" });

    // Divider Line
    this.doc.setDrawColor(...COLORS.LINE);
    this.doc.setLineWidth(0.5);
    this.doc.line(LAYOUT.MARGIN, LAYOUT.HEADER_HEIGHT, this.pageWidth - LAYOUT.MARGIN, LAYOUT.HEADER_HEIGHT);
  }

  private addInfoSection(purchaseOrder: PurchaseOrderPDFData): void {
    const startY = LAYOUT.HEADER_HEIGHT + 25;
    const colWidth = (this.pageWidth - LAYOUT.MARGIN * 2) / 2;

    // Left Column - Supplier Information
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.PRIMARY);
    this.doc.text("SUPPLIER DETAILS", LAYOUT.MARGIN, startY);

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(11);
    this.doc.setTextColor(...COLORS.TEXT);
    this.doc.text(purchaseOrder.supplier.name, LAYOUT.MARGIN, startY + 16);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.TEXT_LIGHT);
    let supplierY = startY + 30;
    
    if (purchaseOrder.supplier.address) {
      const addrLines = this.doc.splitTextToSize(purchaseOrder.supplier.address, colWidth - 20);
      this.doc.text(addrLines, LAYOUT.MARGIN, supplierY);
      supplierY += addrLines.length * 12 + 4;
    }
    if (purchaseOrder.supplier.phone) {
      this.doc.text(`Phone: ${purchaseOrder.supplier.phone}`, LAYOUT.MARGIN, supplierY);
      supplierY += 12;
    }
    if (purchaseOrder.supplier.email) {
      this.doc.text(`Email: ${purchaseOrder.supplier.email}`, LAYOUT.MARGIN, supplierY);
    }

    // Right Column - Project Information
    const rightX = LAYOUT.MARGIN + colWidth + 20;
    
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.PRIMARY);
    this.doc.text("PROJECT DETAILS", rightX, startY);

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.TEXT);
    this.doc.text(purchaseOrder.project.name, rightX, startY + 16);

    // Delivery Address
    if (purchaseOrder.deliveryAddress) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(9);
      this.doc.setTextColor(...COLORS.TEXT);
      this.doc.text("Delivery Address:", rightX, startY + 32);
      
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.TEXT_LIGHT);
      const addrLines = this.doc.splitTextToSize(purchaseOrder.deliveryAddress, colWidth - 40);
      this.doc.text(addrLines, rightX, startY + 44);
    }

    // Payment Terms
    if (purchaseOrder.paymentTerms) {
      const termsY = purchaseOrder.deliveryAddress ? startY + 70 : startY + 32;
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(9);
      this.doc.setTextColor(...COLORS.TEXT);
      this.doc.text("Payment Terms:", rightX, termsY);
      
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.TEXT_LIGHT);
      const termsLines = this.doc.splitTextToSize(purchaseOrder.paymentTerms, colWidth - 40);
      this.doc.text(termsLines, rightX, termsY + 12);
    }
  }

  private addItemsTable(purchaseOrder: PurchaseOrderPDFData): void {
    const tableStartY = LAYOUT.HEADER_HEIGHT + 120;

    // Prepare table data
    const headers = ["#", "Description", "Quantity", "Unit Price", "Amount"];
    const rows = purchaseOrder.items.map((item: PurchaseOrderItem, index: number) => [
      String(index + 1),
      item.material.name + (item.notes ? ` (${item.notes})` : ''),
      `${item.quantity} ${item.material.unit}`,
      `Rs. ${item.unitPrice.toLocaleString('en-IN')}`,
      `Rs. ${item.amount.toLocaleString('en-IN')}`
    ]);

    autoTable(this.doc, {
      startY: tableStartY,
      head: [headers],
      body: rows,
      theme: "grid",
      margin: { left: LAYOUT.MARGIN, right: LAYOUT.MARGIN },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 8,
        valign: "middle",
        overflow: "linebreak",
        lineColor: [230, 230, 230],
        lineWidth: 0.5,
        textColor: [50, 50, 50],
      },
      headStyles: {
        fillColor: COLORS.TABLE_HEADER,
        textColor: 255,
        fontStyle: "bold",
        halign: "left",
        cellPadding: 10,
      },
      alternateRowStyles: {
        fillColor: COLORS.TABLE_ALT_ROW,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 80 },
        3: { halign: 'right', cellWidth: 80 },
        4: { halign: 'right', cellWidth: 80 },
      },
    });
  }

  private addTotalsSection(purchaseOrder: PurchaseOrderPDFData): void {
    // Get the final Y position after table
    const finalY = (this.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 400;
    const startY = finalY + 20;
    const rightX = this.pageWidth - LAYOUT.MARGIN;
    const labelX = rightX - 150;

    // Subtotal
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.TEXT);
    this.doc.text("Subtotal:", labelX, startY);
    this.doc.text(`Rs. ${purchaseOrder.totalAmount.toLocaleString('en-IN')}`, rightX, startY, { align: "right" });

    // Tax
    let totalsY = startY + 16;
    if (purchaseOrder.taxAmount && purchaseOrder.taxAmount > 0) {
      this.doc.text("Tax:", labelX, totalsY);
      this.doc.text(`Rs. ${purchaseOrder.taxAmount.toLocaleString('en-IN')}`, rightX, totalsY, { align: "right" });
      totalsY += 16;
    }

    // Divider
    this.doc.setDrawColor(...COLORS.LINE);
    this.doc.setLineWidth(0.5);
    this.doc.line(labelX, totalsY, rightX, totalsY);

    // Grand Total
    totalsY += 16;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(...COLORS.PRIMARY);
    this.doc.text("Grand Total:", labelX, totalsY);
    this.doc.text(`Rs. ${purchaseOrder.grandTotal.toLocaleString('en-IN')}`, rightX, totalsY, { align: "right" });
  }

  private addNotesSection(purchaseOrder: PurchaseOrderPDFData): void {
    if (!purchaseOrder.notes) return;

    const finalY = (this.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 400;
    const notesY = finalY + 80;

    // Notes Header
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.PRIMARY);
    this.doc.text("NOTES / REMARKS", LAYOUT.MARGIN, notesY);

    // Notes Content
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.TEXT_LIGHT);
    const notes = this.doc.splitTextToSize(purchaseOrder.notes, this.pageWidth - LAYOUT.MARGIN * 2);
    this.doc.text(notes, LAYOUT.MARGIN, notesY + 14);
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 60;

    // Signature Lines
    this.doc.setDrawColor(...COLORS.LINE);
    this.doc.setLineWidth(0.5);
    this.doc.line(LAYOUT.MARGIN, footerY, LAYOUT.MARGIN + 120, footerY);
    this.doc.line(this.pageWidth - LAYOUT.MARGIN - 120, footerY, this.pageWidth - LAYOUT.MARGIN, footerY);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.TEXT_LIGHT);
    this.doc.text("Authorized Signature", LAYOUT.MARGIN, footerY + 12);
    this.doc.text("Received By", this.pageWidth - LAYOUT.MARGIN - 120, footerY + 12);

    // Bottom Line
    const bottomY = this.pageHeight - 30;
    this.doc.line(LAYOUT.MARGIN, bottomY, this.pageWidth - LAYOUT.MARGIN, bottomY);

    // Timestamp (Bottom Left)
    this.doc.setFontSize(7);
    this.doc.setTextColor(150, 150, 150);
    const timestamp = new Date().toLocaleString('en-IN');
    this.doc.text(`Generated: ${timestamp}`, LAYOUT.MARGIN, this.pageHeight - 18);

    // Disclaimer (Center)
    this.doc.text(
      "This is a computer-generated document. No signature is required.",
      this.pageWidth / 2,
      this.pageHeight - 18,
      { align: "center" }
    );

    // Page Number (Bottom Right)
    this.doc.text("Page 1 of 1", this.pageWidth - LAYOUT.MARGIN, this.pageHeight - 18, { align: "right" });
  }
}

// Utility function to generate and download PDF
export const generatePurchaseOrderPDF = async (purchaseOrder: PurchaseOrderPDFData): Promise<void> => {
  const generator = new PurchaseOrderPDFGenerator();
  const doc = generator.generatePDF(purchaseOrder);
  doc.save(`PO-${purchaseOrder.poNumber}.pdf`);
};
