/**
 * Generates the binary demo assets used by the file-viewer playground card.
 * Everything is written with the standard library only (no dependencies).
 */
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, 'playground/public/samples')
mkdirSync(output, { recursive: true })

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const CRC_TABLE = new Uint32Array(256)
for (let index = 0; index < 256; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  CRC_TABLE[index] = value >>> 0
}

function zip(files) {
  const locals = []
  const centrals = []
  let offset = 0
  const dosTime = (12 << 11) | (0 << 5) | 0
  const dosDate = ((2025 - 1980) << 9) | (1 << 5) | 1

  for (const [name, value] of Object.entries(files)) {
    const nameBytes = Buffer.from(name, 'utf8')
    const data = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8')
    const checksum = crc32(data)

    const local = Buffer.alloc(30 + nameBytes.length)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(dosTime, 10)
    local.writeUInt16LE(dosDate, 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    nameBytes.copy(local, 30)
    locals.push(local, data)

    const central = Buffer.alloc(46 + nameBytes.length)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(dosTime, 12)
    central.writeUInt16LE(dosDate, 14)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBytes.length, 28)
    central.writeUInt32LE(offset, 42)
    nameBytes.copy(central, 46)
    centrals.push(central)

    offset += local.length + data.length
  }

  const centralBuffer = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(files).length, 8)
  end.writeUInt16LE(Object.keys(files).length, 10)
  end.writeUInt32LE(centralBuffer.length, 12)
  end.writeUInt32LE(offset, 16)

  return Buffer.concat([...locals, centralBuffer, end])
}

function png(width, height, color) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  header[10] = 0
  header[11] = 0
  header[12] = 0

  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < width; x += 1) {
      const offset = row + 1 + x * 4
      const diagonal = (x + y) % 160 < 80 ? 0.12 : 0
      raw[offset] = Math.min(255, Math.round(color[0] + (x / width) * 40 + diagonal * 255))
      raw[offset + 1] = Math.min(255, Math.round(color[1] + (y / height) * 30 + diagonal * 180))
      raw[offset + 2] = Math.min(255, Math.round(color[2] + ((x + y) / (width + height)) * 50))
      raw[offset + 3] = 255
    }
  }

  const chunk = (type, data) => {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length, 0)
    const typeBuffer = Buffer.from(type, 'ascii')
    const checksum = Buffer.alloc(4)
    checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
    return Buffer.concat([length, typeBuffer, data, checksum])
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function pdf() {
  const escape = (value) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  const pageContent = (title, subtitle, body, dark) => {
    const background = dark ? '0.04 0.05 0.1' : '0.98 0.99 1'
    const foreground = dark ? '0.92 0.95 1' : '0.08 0.1 0.18'
    const accentColor = dark ? '0.51 0.55 0.97' : '0.31 0.27 0.9'
    const commands = [
      `${background} rg 0 0 612 792 re f`,
      `${accentColor} rg 48 690 120 6 re f`,
      'BT',
      `/F1 30 Tf ${foreground} rg 48 640 Td (${escape(title)}) Tj`,
      `/F1 14 Tf ${foreground} rg 48 608 Td (${escape(subtitle)}) Tj`,
      'ET',
      `${accentColor} rg 48 570 150 4 re f`,
      'BT',
      `/F1 12 Tf ${foreground} rg 48 535 Td 16 TL`,
      ...body.map((line, index) => `${index === 0 ? '' : 'T* '}(${escape(line)}) Tj`),
      'ET',
      `${accentColor} rg 48 90 516 1 re f`,
      'BT',
      `/F1 9 Tf 0.45 0.5 0.6 rg 48 70 Td (Wuhu Vue UI - zero dependency preview) Tj`,
      'ET',
    ]
    return commands.join('\n')
  }

  const contents = [
    pageContent(
      'Wuhu File Viewer',
      'Native PDF fallback + optional pdf.js enhancement',
      [
        'This PDF is embedded by the file viewer. Without pdf.js the browser',
        'native viewer is used. Install pdfjs-dist and pass it through',
        'options.pdf.pdfjs to enable the custom canvas, zoom, rotation,',
        'page navigation and selectable text layer.',
        '',
        'Use the toolbar to zoom, rotate, download or enter fullscreen.',
      ],
      false,
    ),
    pageContent(
      'Second page',
      'Page navigation stays in sync',
      [
        'The viewer reports the page count and emits page-change events so',
        'the application can persist reading position.',
        '',
        'Theme tokens can be overridden with the themeVars prop or with CSS.',
      ],
      true,
    ),
  ]

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(contents[0])} >>\nstream\n${contents[0]}\nendstream`,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
    `<< /Length ${Buffer.byteLength(contents[1])} >>\nstream\n${contents[1]}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let body = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body))
    body += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = Buffer.byteLength(body)
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let index = 1; index <= objects.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  return Buffer.from(body, 'ascii')
}

function wav() {
  const sampleRate = 44100
  const seconds = 3
  const samples = sampleRate * seconds
  const data = Buffer.alloc(samples * 2)
  for (let index = 0; index < samples; index += 1) {
    const time = index / sampleRate
    const envelope = Math.min(1, time * 4) * Math.min(1, (seconds - time) * 2)
    const tone =
      Math.sin(2 * Math.PI * 440 * time) * 0.35 + Math.sin(2 * Math.PI * 660 * time) * 0.18
    data.writeInt16LE(
      Math.max(-32767, Math.min(32767, Math.round(tone * envelope * 32767))),
      index * 2,
    )
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const banner = png(640, 360, [79, 70, 229])
const accent = png(480, 270, [14, 165, 233])
writeFileSync(resolve(output, 'banner.png'), banner)
writeFileSync(resolve(output, 'sample.pdf'), pdf())
writeFileSync(resolve(output, 'sample.wav'), wav())

const contentTypesDocument = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`

const docxRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`

const docxDocumentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`

const docxStyles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="160"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="56"/><w:color w:val="1E1B4B"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="4F46E5"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr>
  </w:style>
  <w:style w:type="character" w:styleId="Emphasis">
    <w:name w:val="Emphasis"/>
    <w:rPr><w:i/><w:color w:val="BE123C"/></w:rPr>
  </w:style>
</w:styles>`

const docxNumbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`

const docxCore = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>Wuhu File Viewer</dc:title>
</cp:coreProperties>`

const docxDocument = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>Wuhu File Viewer</w:t></w:r></w:p>
    <w:p><w:r><w:t>A zero-dependency document preview rendered entirely in the browser.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Everything you see here was parsed from the original DOCX package, including </w:t></w:r><w:r><w:rPr><w:b/><w:color w:val="4F46E5"/></w:rPr><w:t>rich runs</w:t></w:r><w:r><w:t>, </w:t></w:r><w:r><w:rPr><w:rStyle w:val="Emphasis"/></w:rPr><w:t>character styles</w:t></w:r><w:r><w:t>, tables, lists, images and page breaks.</w:t></w:r></w:p>
    <w:p><w:r><w:drawing><wp:inline>
      <wp:extent cx="3048000" cy="1714500"/>
      <wp:docPr id="1" name="Picture 1" descr="Gradient banner"/>
      <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic>
          <pic:nvPicPr><pic:cNvPr id="1" name="image1.png"/><pic:cNvPicPr/></pic:nvPicPr>
          <pic:blipFill><a:blip r:embed="rIdImage1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
          <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="3048000" cy="1714500"/></a:xfrm><a:prstGeom prst="rect"/></pic:spPr>
        </pic:pic>
      </a:graphicData></a:graphic>
    </wp:inline></w:drawing></w:r></w:p>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Key capabilities</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Lazy-loaded renderers for every format</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Light and dark themes with custom token overrides</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>English and Simplified Chinese built in</w:t></w:r></w:p>
    <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Document properties</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr><w:tblW w:type="pct" w:w="5000"/></w:tblPr>
      <w:tblGrid><w:gridCol w:w="2800"/><w:gridCol w:w="2800"/></w:tblGrid>
      <w:tr>
        <w:tc><w:tcPr><w:shd w:val="clear" w:fill="EEF2FF"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Feature</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:shd w:val="clear" w:fill="EEF2FF"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Status</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Tables and merged cells</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Supported</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Images inside the package</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Supported</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:r><w:br w:type="page"/></w:r><w:r><w:t>Page two shows that explicit document page breaks are preserved.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Use the toolbar to zoom, download, print or enter fullscreen.</w:t></w:r></w:p>
  </w:body>
</w:document>`

writeFileSync(
  resolve(output, 'sample.docx'),
  zip({
    '[Content_Types].xml': contentTypesDocument,
    '_rels/.rels': docxRels,
    'docProps/core.xml': docxCore,
    'word/document.xml': docxDocument,
    'word/_rels/document.xml.rels': docxDocumentRels,
    'word/styles.xml': docxStyles,
    'word/numbering.xml': docxNumbering,
    'word/media/image1.png': banner,
  }),
)

const workbookContentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`

const xlsxWorkbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr/>
  <sheets>
    <sheet name="Overview" sheetId="1" r:id="rId1"/>
    <sheet name="Raw data" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`

const xlsxWorkbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`

const xlsxSharedStrings = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="18" uniqueCount="18">
  <si><t>Quarterly revenue</t></si>
  <si><t>Region</t></si>
  <si><t>Q1</t></si>
  <si><t>Q2</t></si>
  <si><t>Growth</t></si>
  <si><t>Updated</t></si>
  <si><t>North America</t></si>
  <si><t>Europe</t></si>
  <si><t>Asia Pacific</t></si>
  <si><t>Total</t></si>
  <si><t>Owner</t></si>
  <si><t>Status</t></si>
  <si><t>Ada</t></si>
  <si><t>Grace</t></si>
  <si><t>Linus</t></si>
  <si><t>Active</t></si>
  <si><t>Pending</t></si>
  <si><t>Review</t></si>
</sst>`

const xlsxStyles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts>
    <numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0"/>
    <numFmt numFmtId="165" formatCode="0.0%"/>
  </numFmts>
  <fonts>
    <font><sz val="11"/><name val="Calibri"/><color rgb="FF1E293B"/></font>
    <font><b/><sz val="18"/><name val="Calibri"/><color rgb="FF1E1B4B"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FF1E293B"/></font>
    <font><sz val="11"/><name val="Calibri"/><color rgb="FF64748B"/></font>
  </fonts>
  <fills>
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF4F46E5"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEF2FF"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
  </fills>
  <borders>
    <border/>
    <border><bottom style="thin"><color rgb="FFE2E8F0"/></bottom></border>
  </borders>
  <cellXfs>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="1" borderId="0" applyFont="1" applyFill="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="14" fontId="4" fillId="0" borderId="0" applyNumberFormat="1" applyFont="1"/>
  </cellXfs>
</styleSheet>`

const xlsxSheet1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="20" customWidth="1"/>
    <col min="2" max="5" width="14" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1" ht="32" customHeight="1"><c r="A1" t="s" s="1"><v>0</v></c></row>
    <row r="3">
      <c r="A3" t="s" s="2"><v>1</v></c>
      <c r="B3" t="s" s="2"><v>2</v></c>
      <c r="C3" t="s" s="2"><v>3</v></c>
      <c r="D3" t="s" s="2"><v>4</v></c>
      <c r="E3" t="s" s="2"><v>5</v></c>
    </row>
    <row r="4">
      <c r="A4" t="s" s="0"><v>6</v></c>
      <c r="B4" s="3"><v>128000</v></c>
      <c r="C4" s="3"><v>156000</v></c>
      <c r="D4" s="4"><v>0.2188</v></c>
      <c r="E4" s="6"><v>45658</v></c>
    </row>
    <row r="5">
      <c r="A5" t="s" s="0"><v>7</v></c>
      <c r="B5" s="3"><v>98000</v></c>
      <c r="C5" s="3"><v>112500</v></c>
      <c r="D5" s="4"><v>0.148</v></c>
      <c r="E5" s="6"><v>45658</v></c>
    </row>
    <row r="6">
      <c r="A6" t="s" s="0"><v>8</v></c>
      <c r="B6" s="3"><v>86000</v></c>
      <c r="C6" s="3"><v>134000</v></c>
      <c r="D6" s="4"><v>0.5581</v></c>
      <c r="E6" s="6"><v>45658</v></c>
    </row>
    <row r="8">
      <c r="A8" t="s" s="5"><v>9</v></c>
      <c r="B8" s="5"><v>312000</v></c>
      <c r="C8" s="5"><v>402500</v></c>
      <c r="D8" s="5"><v>0.29</v></c>
    </row>
    <row r="10">
      <c r="A10" t="s" s="5"><v>9</v></c>
      <c r="B10" s="3"><f>SUM(B4:B6)</f><v>312000</v></c>
      <c r="C10" s="3"><f>SUM(C4:C6)</f><v>402500</v></c>
    </row>
  </sheetData>
  <mergeCells><mergeCell ref="A1:E1"/></mergeCells>
</worksheet>`

const xlsxSheet2 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="s" s="2"><v>10</v></c>
      <c r="B1" t="s" s="2"><v>11</v></c>
    </row>
    <row r="2"><c r="A2" t="s"><v>12</v></c><c r="B2" t="s"><v>15</v></c></row>
    <row r="3"><c r="A3" t="s"><v>13</v></c><c r="B3" t="s"><v>16</v></c></row>
    <row r="4"><c r="A4" t="s"><v>14</v></c><c r="B4" t="s"><v>17</v></c></row>
  </sheetData>
</worksheet>`

writeFileSync(
  resolve(output, 'sample.xlsx'),
  zip({
    '[Content_Types].xml': workbookContentTypes,
    '_rels/.rels': docxRels.replace('word/document.xml', 'xl/workbook.xml'),
    'docProps/core.xml': docxCore.replace('Wuhu File Viewer', 'Revenue workbook'),
    'xl/workbook.xml': xlsxWorkbook,
    'xl/_rels/workbook.xml.rels': xlsxWorkbookRels,
    'xl/styles.xml': xlsxStyles,
    'xl/sharedStrings.xml': xlsxSharedStrings,
    'xl/worksheets/sheet1.xml': xlsxSheet1,
    'xl/worksheets/sheet2.xml': xlsxSheet2,
  }),
)

const pptxContentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`

const pptxPresentation = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
  </p:sldIdLst>
</p:presentation>`

const pptxPresentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
</Relationships>`

const pptxSlide1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="0B1020"/></a:solidFill></p:bgPr></p:bg>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="762000" y="1143000"/><a:ext cx="8382000" cy="1600200"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr anchor="b"/>
          <a:p><a:pPr algn="l"/><a:r><a:rPr sz="4800" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>Preview every file</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Subtitle"/><p:cNvSpPr/><p:nvPr><p:ph type="subTitle" idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="762000" y="2971800"/><a:ext cx="8382000" cy="914400"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:pPr algn="l"/><a:r><a:rPr sz="2200"><a:solidFill><a:srgbClr val="A5B4FC"/></a:solidFill></a:rPr><a:t>Office, PDF, EPUB, archives and code — without plugins.</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="4" name="Banner" descr="Banner"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImage1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="9144000" y="1143000"/><a:ext cx="2286000" cy="1285875"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="5" name="Accent"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="762000" y="4267200"/><a:ext cx="3657600" cy="76200"/></a:xfrm><a:solidFill><a:srgbClr val="6366F1"/></a:solidFill></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="6" name="Footer"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="762000" y="5486400"/><a:ext cx="8382000" cy="457200"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:p><a:pPr algn="l"/><a:r><a:rPr sz="1400"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr><a:t>Wuhu Vue UI · @wuhu-vue-ui/file-viewer</a:t></a:r></a:p></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`

const pptxSlide1Rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
</Relationships>`

const pptxSlide2 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="F8FAFC"/></a:solidFill></p:bgPr></p:bg>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="762000" y="609600"/><a:ext cx="10668000" cy="1143000"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr anchor="b"/><a:p><a:pPr algn="l"/><a:r><a:rPr sz="4000" b="1"><a:solidFill><a:srgbClr val="1E1B4B"/></a:solidFill></a:rPr><a:t>Built for real applications</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Body"/><p:cNvSpPr/><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="914400" y="2133600"/><a:ext cx="10058400" cy="3657600"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:pPr><a:buChar char="•"/></a:pPr><a:r><a:rPr sz="2200"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>Lazy-loaded renderers keep the initial bundle small</a:t></a:r></a:p>
          <a:p><a:pPr><a:buChar char="•"/></a:pPr><a:r><a:rPr sz="2200"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>SSR-safe and dependency-free (only Vue as a peer)</a:t></a:r></a:p>
          <a:p><a:pPr><a:buChar char="•"/></a:pPr><a:r><a:rPr sz="2200"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>Themeable with CSS variables, localized with message overrides</a:t></a:r></a:p>
          <a:p><a:pPr><a:buChar char="•"/></a:pPr><a:r><a:rPr sz="2200"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>Slots, keyboard shortcuts and a full public API</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Badge"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="9144000" y="5486400"/><a:ext cx="2286000" cy="609600"/></a:xfrm><a:solidFill><a:srgbClr val="EEF2FF"/></a:solidFill><a:ln w="12700"><a:solidFill><a:srgbClr val="C7D2FE"/></a:solidFill></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchor="ctr"/><a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="1400" b="1"><a:solidFill><a:srgbClr val="4F46E5"/></a:solidFill></a:rPr><a:t>13 components strong</a:t></a:r></a:p></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`

writeFileSync(
  resolve(output, 'sample.pptx'),
  zip({
    '[Content_Types].xml': pptxContentTypes,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`,
    'docProps/core.xml': docxCore.replace('Wuhu File Viewer', 'Product deck'),
    'ppt/presentation.xml': pptxPresentation,
    'ppt/_rels/presentation.xml.rels': pptxPresentationRels,
    'ppt/slides/slide1.xml': pptxSlide1,
    'ppt/slides/_rels/slide1.xml.rels': pptxSlide1Rels,
    'ppt/slides/slide2.xml': pptxSlide2,
    'ppt/media/image1.png': accent,
  }),
)

const epubContainer = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`

const epubOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">urn:uuid:wuhu-file-viewer-demo</dc:identifier>
    <dc:title>Small previews, everywhere</dc:title>
    <dc:creator>Wuhu Vue UI</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="cover" href="cover.png" media-type="image/png"/>
  </manifest>
  <spine><itemref idref="chapter1"/><itemref idref="chapter2"/></spine>
</package>`

const epubNav = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>Contents</title></head>
  <body>
    <nav epub:type="toc">
      <h1>Contents</h1>
      <ol>
        <li><a href="chapter1.xhtml">A simpler previewer</a></li>
        <li><a href="chapter2.xhtml">What is included</a></li>
      </ol>
    </nav>
  </body>
</html>`

const epubChapter1 = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>A simpler previewer</title></head>
  <body>
    <h1>A simpler previewer</h1>
    <p>The <strong>WuFileViewer</strong> component renders books, documents and media directly in the browser. It keeps the DOM small by loading a renderer only when that format is opened.</p>
    <p><img src="cover.png" alt="Cover"/></p>
    <blockquote>Everything is themeable through CSS variables and every label can be localized.</blockquote>
    <p><a href="chapter2.xhtml">Continue to chapter two</a></p>
  </body>
</html>`

const epubChapter2 = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>What is included</title></head>
  <body>
    <h1>What is included</h1>
    <p>Office documents, PDF, images, audio, video, Markdown, source code, CSV, archives and EPUB all share the same toolbar and theming system.</p>
    <ul>
      <li>Lightweight core with lazy renderers</li>
      <li>Accessible controls and keyboard shortcuts</li>
      <li>Composable slots for custom actions</li>
    </ul>
  </body>
</html>`

writeFileSync(
  resolve(output, 'sample.epub'),
  zip({
    mimetype: 'application/epub+zip',
    'META-INF/container.xml': epubContainer,
    'OEBPS/content.opf': epubOpf,
    'OEBPS/nav.xhtml': epubNav,
    'OEBPS/chapter1.xhtml': epubChapter1,
    'OEBPS/chapter2.xhtml': epubChapter2,
    'OEBPS/cover.png': accent,
  }),
)

writeFileSync(
  resolve(output, 'sample.rtf'),
  String.raw`{\rtf1\ansi\ansicpg1252\deff0
{\fonttbl{\f0\fswiss Helvetica;}{\f1\fmodern Courier New;}}
{\colortbl;\red79\green70\blue229;\red220\green38\blue38;\red71\green85\blue105;}
\pard\qc\f0\fs44\b Wuhu File Viewer\b0\par
\pard\qc\f0\fs22\cf2 A client-side Rich Text preview\cf0\par
\par
\pard\f0\fs24 This RTF document is parsed entirely in your browser. Groups, character styles, fonts, colors, paragraphs, tabs, code-page escapes and Unicode are supported.\par
\par
\pard\f0\fs28\b\cf1 Key formats\cf0\b0\par
\pard\f1\fs22\bullet\tab DOCX, XLSX, PPTX and ODF\par
\pard\f1\fs22\bullet\tab PDF, EPUB and Markdown\par
\pard\f1\fs22\bullet\tab Images, audio, video and archives\par
\par
\pard\f0\fs20\cf2\i Rendered with @wuhu-vue-ui/file-viewer\i0\cf0\par
}`,
)

writeFileSync(
  resolve(output, 'sample.zip'),
  zip({
    'readme.txt':
      'Wuhu File Viewer archive demo.\nOpen the files on the left to preview them without extracting.',
    'src/demo.ts': `export function greet(name: string): string {\n  return \`Hello, \${name}!\`\n}\n`,
    'data/config.json': JSON.stringify({ theme: 'dark', locale: 'en', lazy: true }, null, 2),
    'assets/colors.csv': 'token,value\nprimary,#4f46e5\naccent,#0ea5e9\n',
  }),
)

// The docs site serves its own /public directory, so keep a synchronized copy
// instead of relying on manual duplication.
const docsOutput = resolve(root, 'docs/public/samples')
rmSync(docsOutput, { recursive: true, force: true })
cpSync(output, docsOutput, { recursive: true })

process.stdout.write(`Generated file-viewer samples in ${output} and ${docsOutput}\n`)
