import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ exportId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { exportId } = await params;
  const s = createAdminSupabaseClient();
  const { data: exp } = await s.from('exports').select('*').eq('id', exportId).eq('user_id', user.id).single();
  if (!exp?.input_content) return NextResponse.json({ error: 'Export not found' }, { status: 404 });

  const format = exp.format;
  const title = exp.title;
  const content = exp.input_content;

  const MIME: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain', md: 'text/markdown',
  };

  try {
    let buffer: Buffer;
    let filename = `${title.replace(/[^a-z0-9\-_]/gi, '_').slice(0, 50)}.${format}`;

    if (format === 'txt' || format === 'md') {
      buffer = Buffer.from(format === 'md' ? `# ${title}\n\n${content}` : `${title}\n\n${content}`, 'utf-8');
    } else if (format === 'pdf') {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth(), margin = 20;
      doc.setFontSize(20); doc.setTextColor(14, 144, 230); doc.text(title, margin, 28);
      doc.setFontSize(10); doc.setTextColor(200, 200, 200);
      const lines = doc.splitTextToSize(content, W - margin * 2);
      let y = 44; const lh = 5.5;
      for (const line of lines) {
        if (y + lh > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y); y += lh;
      }
      buffer = Buffer.from(doc.output('arraybuffer'));
    } else if (format === 'docx') {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const paras = content.split('\n').filter((l: string) => l.trim()).map((line: string) => {
        if (line.startsWith('# ')) return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 });
        if (line.startsWith('## ')) return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 });
        return new Paragraph({ children: [new TextRun({ text: line, size: 24 })] });
      });
      const docdoc = new Document({ sections: [{ children: [new Paragraph({ text: title, heading: HeadingLevel.TITLE }), ...paras] }] });
      buffer = await Packer.toBuffer(docdoc);
    } else if (format === 'xlsx') {
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(title.slice(0, 31));
      content.split('\n').filter((l: string) => l.trim()).forEach((line: string, i: number) => {
        const row = ws.addRow([line]);
        if (i === 0) { row.font = { bold: true }; row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E90E6' } }; }
      });
      buffer = Buffer.from(await wb.xlsx.writeBuffer());
    } else if (format === 'pptx') {
      const PptxGenJS = await import('pptxgenjs');
      const pptx = new PptxGenJS.default();
      pptx.title = title;
      const sections = content.split(/\n#{1,2}\s+/).filter(Boolean);
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: '0A0A0F' };
      titleSlide.addText(title, { x: 0.5, y: 2, w: 9, h: 1.5, fontSize: 32, bold: true, color: '0E90E6', align: 'center' });
      sections.forEach((sec: string) => {
        const lines = sec.split('\n'); const slide = pptx.addSlide();
        slide.background = { color: '0A0A0F' };
        slide.addText(lines[0] || 'Slide', { x: 0.5, y: 0.4, w: 9, h: 0.8, fontSize: 22, bold: true, color: 'E1E1E1' });
        slide.addText(lines.slice(1).join('\n').trim(), { x: 0.5, y: 1.4, w: 9, h: 4, fontSize: 14, color: '888888', valign: 'top', wrap: true });
      });
      buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    } else {
      buffer = Buffer.from(content, 'utf-8');
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': MIME[format] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
