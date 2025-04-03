import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF from a HTML element
 * @param element The HTML element to convert to PDF
 * @param filename The filename for the downloaded PDF
 */
export const generatePDF = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    const canvas = await html2canvas(element, { scale: 1.5 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (typeof window !== 'undefined' && window.alert) {
      window.alert('Failed to generate PDF. Please try again.');
    }
  }
};
