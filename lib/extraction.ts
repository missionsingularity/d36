import JSZip from 'jszip';

export async function extractOriginal(bytes:Buffer,extension:string):Promise<string> {
  if(extension==='txt'||extension==='csv')return bytes.toString('utf8').slice(0,50000);
  if(extension==='docx') {
    const zip=await JSZip.loadAsync(bytes);
    const entry=zip.file('word/document.xml');
    if(!entry)throw new Error('The DOCX does not contain a Word document.');
    const xml=await entry.async('string');
    return xml.replace(/<\/w:p>/g,'\n').replace(/<w:tab\s*\/>/g,'\t')
      .replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
      .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').trim().slice(0,50000);
  }
  if(extension==='pdf') {
    const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
    const document=await getDocument({data:new Uint8Array(bytes),useSystemFonts:true,isEvalSupported:false}).promise;
    try {
      const pages:string[]=[];
      let size=0;
      for(let number=1;number<=document.numPages&&size<50000;number++) {
        const page=await document.getPage(number);
        const content=await page.getTextContent();
        const text=content.items.map(item=>'str' in item?item.str:'').join(' ');
        pages.push(`Page ${number}\n${text}`);
        size+=text.length;
      }
      return pages.join('\n\n').slice(0,50000);
    }finally{await document.destroy()}
  }
  throw new Error('Unsupported extraction format');
}
