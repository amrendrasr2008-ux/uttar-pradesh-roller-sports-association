import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function oklchToRgb(oklchStr: string): string {
  try {
    const match = oklchStr.match(/oklch\(\s*([^)]+)\s*\)/i);
    if (!match) return 'rgb(15, 23, 42)';

    const content = match[1].trim();
    let colorPart = content;
    let alpha = 1;

    if (content.includes('/')) {
      const parts = content.split('/');
      colorPart = parts[0].trim();
      const alphaStr = parts[1].trim();
      if (alphaStr.endsWith('%')) {
        alpha = parseFloat(alphaStr) / 100;
      } else {
        alpha = parseFloat(alphaStr);
      }
      if (isNaN(alpha)) alpha = 1;
    }

    const mainParts = colorPart.split(/\s+/);
    if (mainParts.length < 3) return 'rgb(15, 23, 42)';

    // 1. Lightness (L)
    let L = 0;
    if (mainParts[0].endsWith('%')) {
      L = parseFloat(mainParts[0]) / 100;
    } else {
      L = parseFloat(mainParts[0]);
    }
    if (isNaN(L)) L = 0;

    // 2. Chroma (C)
    let C = 0;
    if (mainParts[1].toLowerCase() !== 'none') {
      if (mainParts[1].endsWith('%')) {
        C = (parseFloat(mainParts[1]) / 100) * 0.4;
      } else {
        C = parseFloat(mainParts[1]);
      }
    }
    if (isNaN(C)) C = 0;

    // 3. Hue (H)
    let H = 0;
    if (mainParts[2].toLowerCase() !== 'none') {
      let hStr = mainParts[2];
      if (hStr.endsWith('deg')) hStr = hStr.slice(0, -3);
      else if (hStr.endsWith('rad')) hStr = (parseFloat(hStr) * 180 / Math.PI).toString();
      else if (hStr.endsWith('turn')) hStr = (parseFloat(hStr) * 360).toString();
      H = parseFloat(hStr);
    }
    if (isNaN(H)) H = 0;

    // Convert OKLCH to OKLAB
    const rad = (H * Math.PI) / 180;
    const a_oklab = C * Math.cos(rad);
    const b_oklab = C * Math.sin(rad);

    // OKLAB to LMS
    const l_ = L;
    const l = l_ + 0.3963377774 * a_oklab + 0.2158037573 * b_oklab;
    const m = l_ - 0.1055613458 * a_oklab - 0.0638541728 * b_oklab;
    const s = l_ - 0.0894841775 * a_oklab - 1.2914855480 * b_oklab;

    // Cube LMS
    const l3 = l * l * l;
    const m3 = m * m * m;
    const s3 = s * s * s;

    // LMS to Linear sRGB
    const r_lin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const g_lin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const b_lin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

    // Linear sRGB to Gamma sRGB
    const transfer = (c: number) =>
      c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;

    const r = Math.min(255, Math.max(0, Math.round(transfer(r_lin) * 255)));
    const g = Math.min(255, Math.max(0, Math.round(transfer(g_lin) * 255)));
    const b = Math.min(255, Math.max(0, Math.round(transfer(b_lin) * 255)));

    if (isNaN(r) || isNaN(g) || isNaN(b)) return 'rgb(15, 23, 42)';

    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch (e) {
    return 'rgb(15, 23, 42)';
  }
}

export function replaceOklchInString(str: string): string {
  if (!str || typeof str !== 'string' || !str.includes('oklch')) {
    return str;
  }

  return str.replace(/oklch\([^)]+\)/gi, (match) => oklchToRgb(match));
}

export function prepareClonedDocForHtml2Canvas(clonedDoc: Document): void {
  try {
    // 1. Clean all <style> tags
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((styleEl) => {
      if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
        styleEl.textContent = replaceOklchInString(styleEl.textContent);
      }
    });

    // 2. Clean inline style attributes
    const elementsWithStyle = clonedDoc.querySelectorAll('[style]');
    elementsWithStyle.forEach((el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr && styleAttr.includes('oklch')) {
        el.setAttribute('style', replaceOklchInString(styleAttr));
      }
    });

    // 3. Walk ALL elements and set explicit inline properties for computed oklch colors
    const clonedWin = clonedDoc.defaultView;
    const allElements = clonedDoc.querySelectorAll('*');
    const colorProps = [
      'color',
      'background-color',
      'border-color',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'outline-color',
      'fill',
      'stroke',
      'text-decoration-color',
      'box-shadow'
    ];

    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (clonedWin) {
        try {
          const comp = clonedWin.getComputedStyle(htmlEl);
          colorProps.forEach((prop) => {
            const val = comp.getPropertyValue(prop);
            if (val && val.includes('oklch')) {
              htmlEl.style.setProperty(prop, replaceOklchInString(val), comp.getPropertyPriority(prop));
            }
          });
        } catch (e) {
          // ignore element style read errors
        }
      }
    });

    // 4. Clean stylesheets if accessible
    if (clonedDoc.styleSheets) {
      Array.from(clonedDoc.styleSheets).forEach((sheet) => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            Array.from(rules).forEach((rule) => {
              const styleRule = rule as CSSStyleRule;
              if (styleRule && styleRule.style) {
                for (let i = 0; i < styleRule.style.length; i++) {
                  const prop = styleRule.style[i];
                  const val = styleRule.style.getPropertyValue(prop);
                  if (val && val.includes('oklch')) {
                    styleRule.style.setProperty(prop, replaceOklchInString(val));
                  }
                }
              }
            });
          }
        } catch (e) {
          // Ignore cross-origin CSS policy issues
        }
      });
    }

    // 5. Proxy getComputedStyle on defaultView
    if (clonedWin) {
      const origGetComputedStyle = clonedWin.getComputedStyle.bind(clonedWin);
      clonedWin.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
        const style = origGetComputedStyle(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop, receiver) {
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (val && typeof val === 'string' && val.includes('oklch')) {
                  return replaceOklchInString(val);
                }
                return val;
              };
            }
            const val = Reflect.get(target, prop, receiver);
            if (typeof val === 'function') {
              return val.bind(target);
            }
            if (typeof val === 'string' && val.includes('oklch')) {
              return replaceOklchInString(val);
            }
            return val;
          }
        });
      };
    }
  } catch (err) {
    console.warn('onclone style sanitization warning:', err);
  }
}

export function getSafeHtml2CanvasOptions(customOptions: Record<string, any> = {}) {
  const userOnClone = customOptions.onclone;
  return {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#0f172a',
    ...customOptions,
    onclone: (clonedDoc: Document, element: HTMLElement) => {
      prepareClonedDocForHtml2Canvas(clonedDoc);
      if (typeof userOnClone === 'function') {
        userOnClone(clonedDoc, element);
      }
    }
  };
}

export async function renderElementToCanvas(element: HTMLElement, customOptions: Record<string, any> = {}) {
  const origWindowGetComputedStyle = window.getComputedStyle.bind(window);

  // Wrap window.getComputedStyle temporarily during rendering
  window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
    const style = origWindowGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return function (propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            if (val && typeof val === 'string' && val.includes('oklch')) {
              return replaceOklchInString(val);
            }
            return val;
          };
        }
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'function') {
          return val.bind(target);
        }
        if (typeof val === 'string' && val.includes('oklch')) {
          return replaceOklchInString(val);
        }
        return val;
      }
    });
  };

  try {
    const canvas = await html2canvas(element, getSafeHtml2CanvasOptions(customOptions));
    return canvas;
  } finally {
    window.getComputedStyle = origWindowGetComputedStyle;
  }
}

export async function downloadElementAsPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID '${elementId}' not found for PDF generation.`);
    return;
  }

  try {
    const canvas = await renderElementToCanvas(element);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('PDF export failed. You can use browser print instead.');
  }
}

export function printElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Report content not found for printing.');
    return;
  }
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>UPRSA Official Report</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background-color: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
          @media print {
            body { background-color: #ffffff; color: #000000; }
            .no-print { display: none !important; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; }
          }
        </style>
      </head>
      <body>
        <div>${element.innerHTML}</div>
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const val = row[header] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, sheetName: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;

  const headers = Object.keys(rows[0]);
  
  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetName}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      th { background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; }
      td { border: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

