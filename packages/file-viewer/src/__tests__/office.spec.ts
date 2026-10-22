import { describe, expect, it } from 'vite-plus/test'
import { parseDocx } from '../core/docx'
import { parseEpub, renderEpubChapter } from '../core/epub'
import { parseOds } from '../core/odf'
import { parsePptx } from '../core/pptx'
import { parseXlsx } from '../core/xlsx'
import type { ZipReaderLike } from '../core/zip'

function createZip(files: Record<string, string>): ZipReaderLike {
  return {
    has: (name) => Object.prototype.hasOwnProperty.call(files, name),
    text: async (name) => files[name] ?? '',
    read: async (name) => new TextEncoder().encode(files[name] ?? ''),
  }
}

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

const DOCX_FILES = {
  'word/document.xml': `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="${WORD_NS}">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Hello document</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/><w:color w:val="FF0000"/></w:rPr><w:t>Bold red</w:t></w:r></w:p>
    <w:tbl>
      <w:tr><w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr><w:p><w:r><w:t>Merged</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p><w:r><w:br w:type="page"/></w:r><w:r><w:t>Second page</w:t></w:r></w:p>
  </w:body>
</w:document>`,
  'word/styles.xml': `<?xml version="1.0" encoding="UTF-8"?>
<w:styles xmlns:w="${WORD_NS}">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/></w:rPr>
  </w:style>
</w:styles>`,
}

const XLSX_FILES = {
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr/>
  <sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
  'xl/sharedStrings.xml': `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <si><t>Name</t></si><si><t>Count</t></si><si><t>Alpha</t></si>
</sst>`,
  'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts>
  <fonts><font/><font><b/></font><font><color rgb="FF1E1B4B"/></font></fonts>
  <fills><fill><patternFill patternType="none"/></fill></fills>
  <borders><border/></borders>
  <cellXfs>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="164" fontId="1" fillId="0" borderId="0" applyNumberFormat="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0"/>
  </cellXfs>
</styleSheet>`,
  'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
    <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" s="1"><v>45000</v></c><c r="C2" s="2" t="s"><v>2</v></c></row>
  </sheetData>
  <mergeCells><mergeCell ref="A3:B3"/></mergeCells>
</worksheet>`,
}

const ODS_FILES = {
  'content.xml': `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="ce1" style:family="table-cell">
      <style:text-properties fo:color="#1E1B4B" fo:font-weight="bold"/>
    </style:style>
  </office:automatic-styles>
  <office:body>
    <office:spreadsheet>
      <table:table table:name="Sheet1">
        <table:table-row>
          <table:table-cell table:style-name="ce1" office:value-type="string">
            <text:p>Colored cell</text:p>
          </table:table-cell>
        </table:table-row>
      </table:table>
    </office:spreadsheet>
  </office:body>
</office:document-content>`,
}

const PPTX_FILES = {
  'ppt/presentation.xml': `<?xml version="1.0" encoding="UTF-8"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst>
</p:presentation>`,
  'ppt/_rels/presentation.xml.rels': `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`,
  'ppt/slides/slide1.xml': `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="609600" y="457200"/><a:ext cx="10972800" cy="1143000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:r><a:rPr sz="3200" b="1"><a:solidFill><a:srgbClr val="1F2937"/></a:solidFill></a:rPr><a:t>Quarterly review</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`,
}

const EPUB_FILES = {
  'META-INF/container.xml': `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
  'OEBPS/content.opf': `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Demo Book</dc:title>
    <dc:creator>Ada</dc:creator>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="image" href="images/pic.png" media-type="image/png"/>
  </manifest>
  <spine><itemref idref="chapter1"/><itemref idref="chapter2"/></spine>
</package>`,
  'OEBPS/nav.xhtml': `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <body><nav epub:type="toc"><ol>
    <li><a href="chapter1.xhtml">First chapter</a></li>
    <li><a href="chapter2.xhtml">Second chapter</a></li>
  </ol></nav></body>
</html>`,
  'OEBPS/chapter1.xhtml': `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>One</title><script>alert(1)</script></head>
  <body><h1>Chapter one</h1><p>Hello <strong>reader</strong>.</p>
  <p><img src="images/pic.png" alt="pic"/></p>
  <p><a href="chapter2.xhtml">Next chapter</a></p></body>
</html>`,
  'OEBPS/chapter2.xhtml': `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Chapter two</h1></body></html>`,
  'OEBPS/images/pic.png': 'fake-png',
}

describe('DOCX parser', () => {
  it('renders headings, runs, tables and page breaks', async () => {
    const result = await parseDocx(createZip(DOCX_FILES), {}, async () => null)
    expect(result.pages).toHaveLength(2)
    expect(result.pages[0]).toContain('Hello document')
    expect(result.pages[0]).toContain('w-file-viewer__docx-heading--1')
    expect(result.pages[0]).toMatch(/font-weight:600/)
    expect(result.pages[0]).toContain('#FF0000')
    expect(result.pages[0]).toContain('colspan="2"')
    expect(result.pages[0]).toContain('Merged')
    expect(result.pages[1]).toContain('Second page')
  })
})

describe('XLSX parser', () => {
  it('renders sheets, shared strings, date formats and merged cells', async () => {
    const result = await parseXlsx(createZip(XLSX_FILES), { locale: 'en-US' })
    expect(result.sheets).toHaveLength(1)
    const sheet = result.sheets[0]
    expect(sheet?.name).toBe('Data')
    expect(sheet?.html).toContain('Name')
    expect(sheet?.html).toContain('Alpha')
    expect(sheet?.html).toContain('2023-03-15')
    expect(sheet?.html).toContain('colspan="2"')
    expect(sheet?.html).toContain('font-weight:600')
    expect(sheet?.html).toContain('--w-cell-color:#1E1B4B')
    expect(sheet?.html).toContain('color:var(--w-cell-color, inherit)')
    expect(sheet?.html).not.toMatch(/(?:^|;)color:#1E1B4B/)
    expect(sheet?.rowCount).toBe(3)
  })
})

describe('ODS parser', () => {
  it('exposes authored text colors as overridable custom properties', async () => {
    const result = await parseOds(createZip(ODS_FILES))
    const sheet = result.sheets[0]
    expect(sheet?.html).toContain('Colored cell')
    expect(sheet?.html).toContain('--w-cell-color:#1E1B4B')
    expect(sheet?.html).toContain('color:var(--w-cell-color, inherit)')
    expect(sheet?.html).toContain('font-weight:600')
    expect(sheet?.html).not.toMatch(/(?:^|;)color:#1E1B4B/)
  })
})

describe('PPTX parser', () => {
  it('renders positioned text shapes', async () => {
    const result = await parsePptx(createZip(PPTX_FILES), {}, async () => null)
    expect(result.slides).toHaveLength(1)
    expect(result.width).toBe(1280)
    expect(result.height).toBe(720)
    expect(result.slides[0]?.html).toContain('Quarterly review')
    expect(result.slides[0]?.html).toContain('position:absolute')
    expect(result.slides[0]?.title).toBe('Quarterly review')
  })
})

describe('EPUB parser', () => {
  it('reads spine, navigation labels and sanitizes chapters', async () => {
    const zip = createZip(EPUB_FILES)
    const book = await parseEpub(zip)
    expect(book.title).toBe('Demo Book')
    expect(book.author).toBe('Ada')
    expect(book.chapters.map((chapter) => chapter.title)).toEqual([
      'First chapter',
      'Second chapter',
    ])

    const html = await renderEpubChapter(zip, book, 0, async () => 'blob:image')
    expect(html).toContain('Chapter one')
    expect(html).toContain('<strong>reader</strong>')
    expect(html).toContain('blob:image')
    expect(html).toContain('data-epub-page="2"')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
  })
})
