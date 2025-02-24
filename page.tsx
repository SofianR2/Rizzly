"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImagePlus, Loader2, Copy } from "lucide-react"
import { analyzeConversation } from "./actions"
import Image from "next/image"

export default function Home() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [context, setContext] = useState("")
  const [responses, setResponses] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image || !context) {
      setError("Please provide both a conversation screenshot and context")
      return
    }

    setLoading(true)
    setError(null)
    setResponses(null)

    const formData = new FormData()
    formData.append("image", image)
    formData.append("context", context)

    const result = await analyzeConversation(formData)
    setLoading(false)

    if (result.success) {
      setResponses(result.response)
    } else {
      setError(result.error)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-400 to-purple-500">
      <div className="flex flex-col items-center mb-8">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Rizzly%20Logo-3HZM3T1KIXlFYwbWmpi0qiHAwhbvly.png"
          alt="Rizzly Logo"
          width={150}
          height={150}
          className="mb-4"
          priority
        />
        <h1 className="text-6xl font-bold text-center bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
          Rizzly
        </h1>
      </div>
      <Card className="max-w-2xl mx-auto p-6 bg-white/90 backdrop-blur">
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-center text-gray-600">
            Upload a conversation screenshot and get contextual response suggestions
          </p>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-40 border-dashed"
                onClick={() => document.getElementById("image-input")?.click()}
              >
                {preview ? (
                  <img
                    src={preview || "/placeholder.svg"}
                    alt="Conversation Preview"
                    className="max-h-36 object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus className="h-8 w-8 text-gray-400" />
                    <span className="text-gray-600">Upload conversation screenshot</span>
                  </div>
                )}
              </Button>
              <input id="image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <div className="space-y-2">
              <label htmlFor="context" className="text-sm font-medium text-gray-700">
                Who are you talking to? (Add relevant context)
              </label>
              <Input
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., my boss, a client, a close friend, etc."
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Responses...
                </>
              ) : (
                "Generate Responses"
              )}
            </Button>
          </div>

          {error && <div className="p-4 text-red-600 bg-red-50 rounded-md">{error}</div>}

          {responses && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg text-purple-900">Suggested Responses:</h2>
              <div className="grid gap-3">
                {responses.split("\n").map((response, index) => {
                  if (response.trim()) {
                    return (
                      <div
                        key={index}
                        className="group relative p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-md hover:from-orange-100 hover:to-purple-100 transition-colors"
                      >
                        <p className="pr-8 text-gray-700">{response}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(response)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          )}
        </form>
      </Card>
    </main>
  )
}

