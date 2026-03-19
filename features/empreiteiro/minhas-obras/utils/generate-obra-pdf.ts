export async function generateObraPdf(containerEl: HTMLElement, obraId: string): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const canvas = await html2canvas(containerEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  if (imgH <= pageH) {
    pdf.addImage(img, 'PNG', 0, 0, imgW, imgH);
  } else {
    let yOffset = 0;
    while (yOffset < imgH) {
      pdf.addImage(img, 'PNG', 0, -yOffset, imgW, imgH);
      yOffset += pageH;
      if (yOffset < imgH) pdf.addPage();
    }
  }

  pdf.save(`relatorio-obra-${obraId}.pdf`);
}
