import * as pdfParse from "pdf-parse";

export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  text: string;
}

export interface MissingFields {
  name: boolean;
  email: boolean;
  phone: boolean;
}

export async function parseResume(buffer: Buffer): Promise<ResumeData> {
  try {
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    // Extract email using regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : undefined;

    // Extract phone using regex (various formats)
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : undefined;

    // Extract name (heuristic approach - first line that looks like a name)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let name: string | undefined;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip lines that are clearly not names
      if (trimmedLine.includes('@') || 
          /^\d/.test(trimmedLine) || 
          trimmedLine.toLowerCase().includes('resume') ||
          trimmedLine.toLowerCase().includes('cv') ||
          trimmedLine.length < 3 ||
          trimmedLine.length > 50) {
        continue;
      }
      
      // Check if it looks like a name (2-4 words, mostly letters)
      const words = trimmedLine.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        const isName = words.every(word => 
          /^[A-Za-z]+[A-Za-z\-'\.]*$/.test(word) && word.length >= 2
        );
        if (isName) {
          name = trimmedLine;
          break;
        }
      }
    }

    return {
      name,
      email,
      phone,
      text
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume file');
  }
}

export function getMissingFields(resumeData: ResumeData): MissingFields {
  return {
    name: !resumeData.name,
    email: !resumeData.email,
    phone: !resumeData.phone,
  };
}

export function getMissingFieldsList(missingFields: MissingFields): string[] {
  const missing: string[] = [];
  if (missingFields.name) missing.push('name');
  if (missingFields.email) missing.push('email');
  if (missingFields.phone) missing.push('phone');
  return missing;
}
