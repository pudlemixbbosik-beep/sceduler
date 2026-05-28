"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const EMOTION_EMOJI: Record<string, string> = {
  Happy: "😊",
  Sad: "😢",
  Angry: "😠",
  Relaxed: "😌",
}

const EMOTION_KR: Record<string, string> = {
  Happy: "행복",
  Sad: "슬픔",
  Angry: "화남",
  Relaxed: "편안",
}

type Phase = "idle" | "detecting" | "streaming" | "chat" | "error"
type Message = { role: "user" | "assistant"; content: string }

export default function DogChatPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<Phase>("idle")
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null)
  const [emotion, setEmotion] = useState<{ label: string; score: number } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState("")
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        } catch {
          setErrorMsg("카메라에 접근할 수 없습니다. 브라우저 권한을 확인해 주세요.")
          return
        }
      }
      if (videoRef.current) videoRef.current.srcObject = stream
    }
    start()
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  function handleCapture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const maxSize = 640
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight))
    canvas.width = video.videoWidth * scale
    canvas.height = video.videoHeight * scale
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
    setCapturedDataUrl(dataUrl)
    runAnalysis(dataUrl)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setCapturedDataUrl(dataUrl)
      runAnalysis(dataUrl)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  async function runAnalysis(dataUrl: string) {
    setPhase("detecting")
    setEmotion(null)
    setMessages([])
    setStreamingText("")
    setErrorMsg(null)

    try {
      const emotionRes = await fetch("/api/dog-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      })
      const emotionData = await emotionRes.json()

      if (!emotionRes.ok || emotionData.error) {
        setErrorMsg(emotionData.error ?? "감정 분석에 실패했습니다.")
        setPhase("error")
        return
      }

      const detectedEmotion = { label: emotionData.label, score: emotionData.score }
      setEmotion(detectedEmotion)

      setPhase("streaming")
      await streamDogResponse(detectedEmotion.label, [], true)
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.")
      setPhase("error")
    }
  }

  async function streamDogResponse(
    emotionLabel: string,
    history: Message[],
    isInitial: boolean,
  ) {
    setIsSending(true)
    setStreamingText("")
    let fullText = ""

    try {
      const res = await fetch("/api/dog-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion: emotionLabel, messages: history, isInitial }),
      })

      if (!res.ok || !res.body) {
        setErrorMsg("대화 생성에 실패했습니다.")
        setPhase("error")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setStreamingText(fullText)
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullText }])
      setStreamingText("")
      setPhase("chat")
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.")
      setPhase("error")
    } finally {
      setIsSending(false)
    }
  }

  async function handleSend() {
    if (!inputText.trim() || !emotion || isSending) return
    const userMsg: Message = { role: "user", content: inputText.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInputText("")
    await streamDogResponse(emotion.label, newMessages, false)
  }

  function handleReset() {
    setCapturedDataUrl(null)
    setEmotion(null)
    setMessages([])
    setStreamingText("")
    setInputText("")
    setErrorMsg(null)
    setPhase("idle")
  }

  const isAnalyzing = phase === "detecting" || phase === "streaming"
  const inChat = phase === "chat" || (phase === "streaming" && messages.length > 0)

  return (
    <main className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b bg-card">
        <span className="text-xl">🐶</span>
        <h1 className="font-semibold text-base">강아지 감정 탐지기</h1>
        {(inChat || phase === "chat") && (
          <Button variant="ghost" size="sm" className="ml-auto text-sm" onClick={handleReset}>
            새로 시작
          </Button>
        )}
      </header>

      {!inChat ? (
        <>
          {/* Camera / Image area */}
          <section className="relative flex-1 overflow-hidden bg-black min-h-0">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn("w-full h-full object-cover", capturedDataUrl && "hidden")}
            />
            {capturedDataUrl && (
              <img
                src={capturedDataUrl}
                alt="캡처된 강아지"
                className="w-full h-full object-cover"
              />
            )}
            {emotion && (
              <div className="absolute top-3 left-3">
                <Badge className="text-sm px-3 py-1 gap-1.5 bg-white/90 text-foreground shadow-md">
                  {EMOTION_EMOJI[emotion.label] ?? "🐾"}
                  <span className="font-semibold">{EMOTION_KR[emotion.label] ?? emotion.label}</span>
                  <span className="text-muted-foreground">{(emotion.score * 100).toFixed(0)}%</span>
                </Badge>
              </div>
            )}
            {!capturedDataUrl && errorMsg?.includes("카메라") && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm px-6 text-center">
                {errorMsg}
              </div>
            )}
          </section>

          {/* Bottom panel */}
          <section className="flex flex-col gap-3 p-4 border-t bg-card min-h-[180px]">
            {isAnalyzing && (
              <div className="flex flex-col gap-2">
                <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
                <div className="h-16 rounded-2xl bg-muted animate-pulse" />
              </div>
            )}

            {phase === "streaming" && streamingText && (
              <div className="relative rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
                <div className="absolute -top-2.5 left-6 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-amber-200 dark:border-b-amber-800" />
                <div className="absolute -top-2 left-[26px] w-0 h-0 border-l-[9px] border-r-[9px] border-b-[9px] border-l-transparent border-r-transparent border-b-amber-50 dark:border-b-amber-950/30" />
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {streamingText}
                  <span className="animate-pulse">▍</span>
                </p>
              </div>
            )}

            {phase === "error" && errorMsg && !errorMsg.includes("카메라") && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 mt-auto">
              <Button
                size="lg"
                className="flex-1 h-14 text-base font-semibold"
                disabled={isAnalyzing}
                onClick={phase === "error" ? handleReset : handleCapture}
              >
                {phase === "idle" && "📸 사진 찍기"}
                {phase === "detecting" && "🔍 감정 분석 중..."}
                {phase === "streaming" && "💬 말 생성 중..."}
                {phase === "error" && "🔄 다시 시도"}
              </Button>
              {(phase === "idle" || phase === "error") && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-5 text-xl"
                  title="갤러리에서 사진 선택"
                  onClick={() => fileInputRef.current?.click()}
                >
                  🖼️
                </Button>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Thumbnail + emotion badge */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50">
            {capturedDataUrl && (
              <img
                src={capturedDataUrl}
                alt="강아지"
                className="w-12 h-12 rounded-xl object-cover border"
              />
            )}
            {emotion && (
              <Badge className="text-sm px-3 py-1 gap-1.5 bg-white/90 text-foreground shadow-sm border">
                {EMOTION_EMOJI[emotion.label] ?? "🐾"}
                <span className="font-semibold">{EMOTION_KR[emotion.label] ?? emotion.label}</span>
                <span className="text-muted-foreground">{(emotion.score * 100).toFixed(0)}%</span>
              </Badge>
            )}
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <span className="text-lg mr-2 self-end mb-0.5">🐶</span>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-bl-sm",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Streaming bubble */}
            {streamingText && (
              <div className="flex justify-start">
                <span className="text-lg mr-2 self-end mb-0.5">🐶</span>
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  {streamingText}
                  <span className="animate-pulse">▍</span>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isSending && !streamingText && (
              <div className="flex justify-start">
                <span className="text-lg mr-2">🐶</span>
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat input */}
          <div className="flex gap-2 p-4 border-t bg-card">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="강아지에게 말 걸기..."
              disabled={isSending}
              className="flex-1 h-12 rounded-xl"
            />
            <Button
              size="lg"
              className="h-12 px-5"
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
            >
              전송
            </Button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </main>
  )
}
