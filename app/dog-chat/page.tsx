"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

type Phase = "idle" | "detecting" | "chatting" | "done" | "error"

export default function DogChatPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [phase, setPhase] = useState<Phase>("idle")
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null)
  const [emotion, setEmotion] = useState<{ label: string; score: number } | null>(null)
  const [dialogue, setDialogue] = useState<string | null>(null)
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    }

    start()

    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

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

  async function runAnalysis(dataUrl: string) {
    setPhase("detecting")
    setEmotion(null)
    setDialogue(null)
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

      setEmotion({ label: emotionData.label, score: emotionData.score })

      setPhase("chatting")
      const chatRes = await fetch("/api/dog-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion: emotionData.label }),
      })
      const chatData = await chatRes.json()

      if (!chatRes.ok || chatData.error) {
        setErrorMsg(chatData.error ?? "대화 생성에 실패했습니다.")
        setPhase("error")
        return
      }

      setDialogue(chatData.dialogue)
      setPhase("done")
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.")
      setPhase("error")
    }
  }

  function handleReset() {
    setCapturedDataUrl(null)
    setEmotion(null)
    setDialogue(null)
    setErrorMsg(null)
    setPhase("idle")
  }

  const isAnalyzing = phase === "detecting" || phase === "chatting"

  return (
    <main className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b bg-card">
        <span className="text-xl">🐶</span>
        <h1 className="font-semibold text-base">강아지 감정 탐지기</h1>
      </header>

      {/* Camera / Image area */}
      <section className="relative flex-1 overflow-hidden bg-black min-h-0">
        {/* Live camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover",
            capturedDataUrl && "hidden",
          )}
        />

        {/* Captured image */}
        {capturedDataUrl && (
          <img
            src={capturedDataUrl}
            alt="캡처된 강아지"
            className="w-full h-full object-cover"
          />
        )}

        {/* Emotion badge overlay */}
        {emotion && phase === "done" && (
          <div className="absolute top-3 left-3">
            <Badge className="text-sm px-3 py-1 gap-1.5 bg-white/90 text-foreground shadow-md">
              {EMOTION_EMOJI[emotion.label] ?? "🐾"}
              <span className="font-semibold">{EMOTION_KR[emotion.label] ?? emotion.label}</span>
              <span className="text-muted-foreground">{(emotion.score * 100).toFixed(0)}%</span>
            </Badge>
          </div>
        )}

        {/* Camera error overlay */}
        {!capturedDataUrl && errorMsg?.includes("카메라") && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm px-6 text-center">
            {errorMsg}
          </div>
        )}
      </section>

      {/* Bottom panel */}
      <section className="flex flex-col gap-3 p-4 border-t bg-card min-h-[180px]">
        {/* Loading skeleton */}
        {isAnalyzing && (
          <div className="flex flex-col gap-2">
            <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-16 rounded-2xl bg-muted animate-pulse" />
          </div>
        )}

        {/* Dog speech bubble */}
        {dialogue && phase === "done" && (
          <div className="relative rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
            {/* Triangle tail */}
            <div className="absolute -top-2.5 left-6 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-amber-200 dark:border-b-amber-800" />
            <div className="absolute -top-2 left-[26px] w-0 h-0 border-l-[9px] border-r-[9px] border-b-[9px] border-l-transparent border-r-transparent border-b-amber-50 dark:border-b-amber-950/30" />
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{dialogue}</p>
          </div>
        )}

        {/* API error */}
        {phase === "error" && errorMsg && !errorMsg.includes("카메라") && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Action button */}
        <Button
          size="lg"
          className="w-full h-14 text-base font-semibold mt-auto"
          disabled={isAnalyzing}
          onClick={phase === "done" || phase === "error" ? handleReset : handleCapture}
        >
          {phase === "idle" && "📸 사진 찍기"}
          {phase === "detecting" && "🔍 감정 분석 중..."}
          {phase === "chatting" && "💬 말 생성 중..."}
          {phase === "done" && "🔄 다시 찍기"}
          {phase === "error" && "🔄 다시 시도"}
        </Button>
      </section>

      {/* Hidden canvas for snapshot */}
      <canvas ref={canvasRef} className="hidden" />
    </main>
  )
}
