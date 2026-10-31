const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, Footer, PageNumber
} = require('docx');

const W = 9638;
const GOLD = 'B8860B', INK = '1F2A44', GREY = '555555';

function rr(text, base = {}) {
  return text.split('**').map((t, i) => new TextRun({ text: t, bold: i % 2 === 1 || base.bold, italics: base.italics, color: base.color, size: base.size }));
}
const p = (text, o = {}) => new Paragraph({ children: rr(text, o), spacing: { after: o.after ?? 110, line: 280 }, keepNext: o.keepNext });
const bl = (text) => new Paragraph({ children: rr(text), numbering: { reference: 'bul', level: 0 }, spacing: { after: 60, line: 270 } });
const nl = (text) => new Paragraph({ children: rr(text), numbering: { reference: 'num', level: 0 }, spacing: { after: 60, line: 270 } });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], keepNext: true });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)], keepNext: true });
const note = (text) => new Paragraph({
  children: rr(text, { italics: true, color: '333333' }),
  spacing: { before: 60, after: 150, line: 270 },
  shading: { type: ShadingType.CLEAR, fill: 'F6F0DD' },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 8 } },
  indent: { left: 200 }
});
const bd = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
function cell(text, w, hdr) {
  const paras = String(text).split('\n').map(line => new Paragraph({ children: rr(line, hdr ? { bold: true, color: 'FFFFFF', size: 19 } : { size: 19 }), spacing: { after: 40, line: 250 } }));
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: { type: ShadingType.CLEAR, fill: hdr ? INK : 'FFFFFF' },
    margins: { top: 60, bottom: 60, left: 90, right: 90 }, children: paras
  });
}
function tbl(headers, rows, widths) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], true)) }),
      ...rows.map(r => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], false)) }))
    ]
  });
}
const gap = () => new Paragraph({ children: [], spacing: { after: 100 } });

function makeDoc(title, footerText, children) {
  return new Document({
    creator: 'Claude', title,
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, font: 'Georgia', color: INK },
          paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 3 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 25, bold: true, font: 'Georgia', color: GOLD },
          paragraph: { spacing: { before: 220, after: 90 }, outlineLevel: 1 } }
      ]
    },
    numbering: { config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 340 } } } }] }
    ] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: footerText + '  •  Page ', size: 18, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GREY })] })] }) },
      children
    }]
  });
}

function titleBlock(c, fileNo, title, sub) {
  c.push(new Paragraph({ children: [new TextRun({ text: fileNo, bold: true, size: 22, color: GOLD, font: 'Georgia' })], spacing: { before: 300, after: 40 } }));
  c.push(new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 46, color: INK, font: 'Georgia' })], spacing: { after: 60 } }));
  c.push(new Paragraph({ children: [new TextRun({ text: sub, italics: true, size: 22, color: GREY })], spacing: { after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 6 } } }));
}

// Standard event file. s = spec
function eventDoc(s) {
  const c = [];
  titleBlock(c, s.fileNo, s.title, s.sub);
  c.push(tbl(['Field', 'Detail'], [
    ['Story-time position', s.position],
    ['Place', s.place],
    ['Text anchor', s.anchor],
    ['Rukmini’s link', s.rukminiLink]
  ], [2400, 7238]));
  c.push(gap());
  c.push(note('Labels. SOURCE = in your supplied files. TEXT = Bhāgavata verse checked in this pass against the Bhāgavatam text (Prabhupāda-edition numbering; verse numbers may be off by one, so confirm before quoting). TRADITION = other Purāṇic or regional sources, not re-checked. ADAPTATION = new invention for the film. Variants are deliberately left for later; this file gathers the event only.'));

  c.push(h1('1. The event in brief'));
  s.brief.forEach(t => c.push(p(t)));

  c.push(h1('2. Beat list'));
  if (s.beatNote) c.push(p(s.beatNote));
  c.push(tbl(s.beatHead, s.beats, s.beatW));
  c.push(gap());

  c.push(h1('3. Cast in this event'));
  c.push(tbl(['Character', 'Role here', 'Note'], s.cast, [2200, 3300, 4138]));
  c.push(gap());

  c.push(h1('4. How Rukmini reaches this event'));
  c.push(p('Rukmini is the protagonist and the story’s camera. Most of this event happens far from her. This section gathers the ways it can reach her, so that it becomes part of her story without Krishna being on screen.'));
  s.reach.forEach(t => c.push(bl(t)));

  c.push(h1('5. Who speaks of Krishna here'));
  c.push(p('DIRECT = names or describes him. INDIRECT = refers to him without naming, or through someone else’s report. EFFECT = shown by what it does. Gist lines are ADAPTATION unless a verse is cited.'));
  c.push(tbl(['Speaker to listener', 'Mode', 'What is said (gist)', 'What it shows of Krishna'], s.talk, [2200, 1000, 3600, 2838]));
  c.push(gap());

  c.push(h1('6. Keeping Krishna hidden'));
  s.hidden.forEach(t => c.push(bl(t)));

  c.push(h1('7. World-welfare beat'));
  c.push(p('One ordinary person shows what the world gains from this event. These people recur across the files (see the ledger file).'));
  c.push(tbl(['Ordinary person (ADAPTATION)', 'What the world gains', 'Proof image'], [s.welfare], [2600, 3400, 3638]));
  c.push(gap());

  c.push(h1('8. Links to the other events and the Manthana'));
  s.links.forEach(t => c.push(bl(t)));

  c.push(h1('9. Open questions for plot-building'));
  c.push(p('Questions to settle when you build the plot. They are not variants.'));
  s.questions.forEach(t => c.push(bl(t)));

  c.push(h1('10. Source notes and cautions'));
  s.cautions.forEach(t => c.push(bl(t)));

  c.push(h1('11. Hand-off for combining files'));
  c.push(tbl(['Direction', 'Connects to'], [['Comes from', s.before], ['Leads to', s.after]], [2200, 7438]));
  return makeDoc(s.title, s.footer, c);
}

function save(doc, path) {
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(path, b); console.log('saved', path); });
}

module.exports = { p, bl, nl, h1, h2, note, tbl, gap, makeDoc, titleBlock, eventDoc, save, W, GOLD, INK, GREY };
