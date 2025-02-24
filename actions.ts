"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function analyzeConversation(formData: FormData) {
  try {
    const image = formData.get("image") as File
    const context = formData.get("context") as string

    if (!image || !context) {
      throw new Error("Image and context information are required")
    }

    const imageBuffer = await image.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString("base64")
    const imageUrl = `data:${image.type};base64,${base64Image}`

    const prompt = `Given this text conversation and knowing that I'm talking to ${context}, 
    please analyze the conversation and provide 4 different possible responses to the latest message. 
    The responses should be:
    1. A friendly and casual response
    2. A professional and formal response
    3. An empathetic and understanding response
    4. A brief and concise response
    
    Make sure each response maintains appropriate tone and context for the conversation.`

    const result = await generateText({
      model: openai("gpt-4-turbo"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              image: new URL(imageUrl),
            },
          ],
        },
      ],
    })

    return { success: true, response: result.text }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

