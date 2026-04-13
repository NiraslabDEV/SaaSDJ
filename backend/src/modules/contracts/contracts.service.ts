import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma/client';
import { sendEmail } from '../../lib/email';

const CONTRACTS_DIR = path.join(process.cwd(), 'public', 'contracts');

export async function generateContract(bookingId: string, requesterId: string): Promise<string> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      artist: { select: { name: true, email: true } },
      client: { select: { name: true, email: true } },
    },
  });

  if (!booking) throw Object.assign(new Error('Booking não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  if (booking.artistId !== requesterId && booking.clientId !== requesterId) {
    throw Object.assign(new Error('Acesso proibido.'), { statusCode: 403, code: 'FORBIDDEN' });
  }

  if (!fs.existsSync(CONTRACTS_DIR)) fs.mkdirSync(CONTRACTS_DIR, { recursive: true });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const yellow = rgb(0.906, 1, 0);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);

  const { width, height } = page.getSize();

  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.055, 0.055, 0.055) });

  page.drawText('PULSO MUSICAL', {
    x: 40, y: height - 50, size: 22, font: fontBold, color: yellow,
  });
  page.drawText('Contrato de Serviço Artístico', {
    x: 40, y: height - 68, size: 10, font, color: rgb(0.7, 0.7, 0.7),
  });

  let y = height - 120;

  function drawSection(title: string) {
    page.drawText(title, { x: 40, y, size: 13, font: fontBold, color: black });
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
    y -= 18;
  }

  function drawRow(label: string, value: string) {
    page.drawText(label + ':', { x: 40, y, size: 10, font: fontBold, color: gray });
    page.drawText(value, { x: 200, y, size: 10, font, color: black });
    y -= 18;
  }

  drawSection('1. Partes');
  drawRow('Artista', booking.artist.name);
  drawRow('Contratante', booking.client.name);
  y -= 10;

  drawSection('2. Evento');
  drawRow('Data', new Date(booking.eventDate).toLocaleDateString('pt-BR', { dateStyle: 'full' }));
  drawRow('Duração', `${booking.durationHours} hora(s)`);
  drawRow('Local', booking.locationAddress);
  y -= 10;

  drawSection('3. Financeiro');
  drawRow('Taxa Base', `R$ ${booking.baseFee.toFixed(2)}`);
  drawRow('Cachê por Hora', `R$ ${booking.hourlyRate.toFixed(2)}/h`);
  drawRow('Horas Contratadas', `${booking.durationHours}h`);
  drawRow('Logística', `R$ ${booking.logisticsFee.toFixed(2)}`);
  y -= 4;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 16;
  page.drawText('TOTAL', { x: 40, y, size: 12, font: fontBold, color: black });
  page.drawText(`R$ ${booking.totalAmount.toFixed(2)}`, { x: 200, y, size: 12, font: fontBold, color: black });
  y -= 30;

  drawSection('4. Termos Gerais');
  const terms = [
    '• O artista compromete-se a comparecer ao local na data e horário acordados.',
    '• O pagamento deve ser efetuado conforme negociação entre as partes.',
    '• Cancelamentos devem ser comunicados com no mínimo 48h de antecedência.',
    '• Este contrato é gerado eletronicamente pela plataforma Pulso Musical.',
  ];
  for (const term of terms) {
    page.drawText(term, { x: 40, y, size: 9, font, color: gray, maxWidth: width - 80 });
    y -= 16;
  }

  y -= 40;
  page.drawLine({ start: { x: 40, y }, end: { x: 240, y }, thickness: 0.5, color: black });
  page.drawLine({ start: { x: 310, y }, end: { x: 510, y }, thickness: 0.5, color: black });
  y -= 14;
  page.drawText(booking.artist.name, { x: 40, y, size: 9, font, color: gray });
  page.drawText(booking.client.name, { x: 310, y, size: 9, font, color: gray });

  y -= 40;
  page.drawText(`Documento gerado em ${new Date().toLocaleString('pt-BR')} | Pulso Musical`, {
    x: 40, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
  });

  const pdfBytes = await pdfDoc.save();
  const filename = `contract-${bookingId}.pdf`;
  const filepath = path.join(CONTRACTS_DIR, filename);
  fs.writeFileSync(filepath, pdfBytes);

  const contractUrl = `/contracts/${filename}`;

  await prisma.booking.update({ where: { id: bookingId }, data: { contractPdfUrl: contractUrl } });
  await prisma.notification.create({ data: { userId: booking.artistId, bookingId, type: 'CONTRACT_READY' } });
  await prisma.notification.create({ data: { userId: booking.clientId, bookingId, type: 'CONTRACT_READY' } });

  return contractUrl;
}
