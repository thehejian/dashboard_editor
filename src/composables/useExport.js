import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export function useExport() {
  async function exportToPng(element, filename = 'dashboard') {
    if (!element) return
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F2F2F7',
      })
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      return true
    } catch (e) {
      console.error('Export PNG failed:', e)
      return false
    }
  }

  async function exportToPdf(element, filename = 'dashboard') {
    if (!element) return
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F2F2F7',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${filename}.pdf`)
      return true
    } catch (e) {
      console.error('Export PDF failed:', e)
      return false
    }
  }

  function generateShareLink(dashboardId, region, period) {
    const baseUrl = window.location.origin + window.location.pathname
    const params = new URLSearchParams()
    params.set('dashboard', dashboardId)
    params.set('region', region)
    params.set('period', period)
    return `${baseUrl}?${params.toString()}`
  }

  function copyShareLink(link) {
    navigator.clipboard.writeText(link).then(() => true).catch(() => false)
  }

  return {
    exportToPng,
    exportToPdf,
    generateShareLink,
    copyShareLink,
  }
}