export function downloadBase64Pdf(base64, filename = 'receipt.pdf') {
  try {
    const linkSource = `data:application/pdf;base64,${base64}`;
    const downloadLink = document.createElement('a');
    downloadLink.href = linkSource;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  } catch (e) {
    console.error('Download PDF failed', e);
  }
}
