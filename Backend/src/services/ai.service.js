const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const {zodToJsonSchema} = require("zod-to-json-schema");
const puppeteer = require("puppeteer");
const pdfParse = require("pdf-parse");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// 1. Keep your Zod Schema (we will use this to validate the final output)
const interviewReportSchema = z.object({
    matchScore: z.number(),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"])
    })),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focusArea: z.string(),
        tasks: z.array(z.string())
    })),
    title: z.string(),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
        // 2. Put the strict JSON template back into the prompt
        const prompt = `You are an expert interview coach. Analyze the candidate details against the job description and generate a structured interview preparation report.
        
        You MUST return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
        Strictly follow this exact JSON structure:
        {
          "matchScore": 85,
          "title": "Backend Developer",
          "technicalQuestions": [
            {
              "question": "string",
              "intention": "string",
              "answer": "string"
            }
          ],
          "behavioralQuestions": [
            {
              "question": "string",
              "intention": "string",
              "answer": "string"
            }
          ],
          "skillGaps": [
            {
              "skill": "string",
              "severity": "low" // MUST be exactly "low", "medium", or "high"
            }
          ],
          "preparationPlan": [
            {
              "day": 1,
              "focusArea": "string",
              "tasks": ["string", "string"]
            }
          ]
        }

        Job Description:
        ${jobDescription}

        Resume:
        ${resume}

        Self Description:
        ${selfDescription}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Make sure this is the correct model string for your SDK version
            contents: prompt,
            config: {
                // This forces the AI to output valid JSON, skipping markdown blocks
                responseMimeType: "application/json", 
            }
        });

        // 3. Parse the text into a JavaScript Object
        const rawData = JSON.parse(response.text);
        
        // 4. Validate it against Zod to guarantee the structure is 100% perfect
        // If the AI missed a key, Zod will catch it here and throw a clear error.
        const cleanData = interviewReportSchema.parse(rawData);

        return cleanData;

        

    } catch (error) {
        console.error("Failed to generate interview report:", error);
    }
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `You are an expert resume writer and ATS optimization specialist. Your task is to create a highly tailored resume that maximizes the candidate's chances of getting shortlisted for the specific job role.

        ## INPUT INFORMATION:

        **Job Description:**
        ${jobDescription}

        **Candidate Resume:**
        ${resume}

        **Candidate Self Description:**
        ${selfDescription}

        ## CRITICAL INSTRUCTIONS:

        1. **Job Description is the PRIMARY REFERENCE** - Extract key skills, requirements, keywords, and role-specific terminology from the job description. Your resume MUST reflect these exactly.

        2. **Tailor the Resume:**
          - Reorder experience to highlight most relevant projects/roles to this specific job
          - Emphasize skills and technologies that match the job description
          - Quantify achievements with metrics where possible
          - Use the exact terminology and keywords from the job description to maximize ATS compatibility
          - Integrate insights from the self-description to showcase personality and motivation

        3. **Content Requirements:**
          - Keep it 1-2 pages maximum when converted to PDF
          - Include: Contact Info, Professional Summary (2-3 lines, tailored to job), Experience, Skills, Education
          - Professional Summary should address why the candidate is a strong fit for THIS specific role
          - Format skills section to match job requirements (group by relevance)
          - Highlight achievements and impact, not just responsibilities

        4. **ATS & Formatting:**
          - Use clean, simple HTML with standard tags (no complex CSS or unusual fonts)
          - Avoid graphics, images, tables, or special characters that break ATS parsing
          - Use proper heading hierarchy (h1, h2, h3)
          - Make sure all text is selectable and parseable
          - Use simple bullet points with clear structure
          - No colored text or backgrounds that affect readability

        5. **Writing Style:**
          - Sound natural and human-written, not AI-generated
          - Use action verbs (Developed, Implemented, Architected, Optimized, etc.)
          - Be concise - every line should add value
          - Focus on impact and results, not just tasks completed
          - Tailor language and tone to match the job industry

        6. **Key Sections Order:**
          - Header (Name, Phone, Email, LinkedIn)
          - Professional Summary (2-3 sentences, tailored to this role)
          - Technical Skills (organized by category, prioritize job requirements)
          - Professional Experience (3-4 most relevant roles with achievements)
          - Education
          - Certifications (if relevant)

        7. **Optimization for This Job:**
          - Research shows 60% of job descriptions are keyword-based. Use keywords naturally throughout.
          - Match required skills in order of importance from job description
          - Highlight experience that directly relates to job responsibilities
          - If self-description mentions unique strengths, integrate them naturally into experience descriptions

        ## OUTPUT FORMAT:

        Return ONLY valid JSON with this structure:
        {
          "html": "<!DOCTYPE html><html>... complete HTML content ...</html>"
        }

        The HTML should be complete, self-contained, and ready to convert to PDF. Use inline CSS for styling (simple, professional design).`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }