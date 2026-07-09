const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error("Gemini API Key is missing!")

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
      }
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

export async function generateIssueDraft(title) {
  const prompt = `You are an expert product manager and technical lead. 
Given the following issue title, generate a VERY BRIEF and CONCISE markdown description for a GitHub/Kanban issue.
Include a short 'Overview' (1-2 sentences max), a short 'Acceptance Criteria' (3 bullet points max).
Keep the total output under 100 words. Do not use h1 (#), start with h3 (###).
Output ONLY the markdown, no conversational filler.

Title: ${title}`

  return await callGemini(prompt)
}

export async function suggestSubtasks(description) {
  const prompt = `You are a technical lead breaking down a large task into smaller subtasks.
Given the following issue description, suggest 3-6 logical subtasks.
Output a JSON array of strings, where each string is a subtask title.
Do NOT output anything other than the raw JSON array (no markdown code blocks, no explanation).

Description:
${description}`

  const response = await callGemini(prompt)
  try {
    const cleanStr = response.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim()
    return JSON.parse(cleanStr)
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", response)
    throw new Error("AI returned invalid subtasks format.")
  }
}

export async function generateSprintSummary(issues) {
  const prompt = `You are a scrum master summarizing a sprint.
Here is a JSON list of issues from the sprint:
${JSON.stringify(issues.map(i => ({ title: i.title, status: i.status || 'unknown' })))}

Write a professional, concise "Sprint Summary" report in markdown.
Include an 'Overview' paragraph, a bulleted list of 'Key Accomplishments' (closed issues), and 'Pending Work' (open issues).
Output ONLY the markdown, no conversational filler.`

  return await callGemini(prompt)
}

export async function triageIssue(title, description) {
  const prompt = `You are an AI Triage Assistant for a software project.
Given the following issue title and description, determine its priority ('low', 'medium', 'high').
Output ONLY a raw JSON object with a single key 'priority'. Example: {"priority": "high"}
Do not output markdown blocks or conversational text.

Title: ${title}
Description: ${description || 'N/A'}`

  const response = await callGemini(prompt)
  try {
    const cleanStr = response.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim()
    return JSON.parse(cleanStr)
  } catch (e) {
    console.error("Failed to parse Gemini triage response:", response)
    return { priority: 'medium' }
  }
}
