import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { ChatMessage } from "../types";

export const exportToMarkdown = (messages: ChatMessage[], topic: string) => {
  const date = new Date().toISOString().split('T')[0];
  let content = `---\ntitle: OrgoMentor Session - ${topic}\ndate: ${date}\n---\n\n`;

  messages.forEach(msg => {
    const role = msg.role === 'user' ? 'Student' : 'OrgoMentor';
    content += `### ${role}\n\n`;
    msg.parts.forEach(part => {
      if (part.text) content += `${part.text}\n\n`;
      if (part.inlineData) content += `*[Image Attachment: ${part.inlineData.mimeType}]*\n\n`;
    });
  });

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OrgoMentor_${topic.replace(/\s+/g, '_')}_${date}.md`;
  a.click();
};

export const exportToPDF = async (messages: ChatMessage[], topic: string) => {
  const doc = new jsPDF();
  const date = new Date().toISOString().split('T')[0];
  let y = 20;

  doc.setFontSize(18);
  doc.text(`OrgoMentor Session: ${topic}`, 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Date: ${date}`, 20, y);
  y += 15;

  messages.forEach(msg => {
    const role = msg.role === 'user' ? 'Student' : 'OrgoMentor';
    doc.setFont("helvetica", "bold");
    doc.text(`${role}:`, 20, y);
    y += 7;
    
    doc.setFont("helvetica", "normal");
    const text = msg.parts.map(p => p.text || "[Attachment]").join('\n');
    const lines = doc.splitTextToSize(text, 170);
    
    lines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 6;
    });
    y += 10;
  });

  doc.save(`OrgoMentor_${topic.replace(/\s+/g, '_')}_${date}.pdf`);
};

export const exportToWord = async (messages: ChatMessage[], topic: string) => {
  const date = new Date().toISOString().split('T')[0];
  
  const sections = messages.map(msg => {
    const role = msg.role === 'user' ? 'Student' : 'OrgoMentor';
    return [
      new Paragraph({
        text: role,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400 },
      }),
      ...msg.parts.map(part => new Paragraph({
        children: [new TextRun(part.text || "[Attachment]")],
        spacing: { after: 200 },
      }))
    ];
  }).flat();

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `OrgoMentor Session: ${topic}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: `Date: ${date}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        ...sections
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OrgoMentor_${topic.replace(/\s+/g, '_')}_${date}.docx`;
  a.click();
};
