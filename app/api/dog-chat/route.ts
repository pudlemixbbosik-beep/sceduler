import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { emotion, messages, isInitial } = (await request.json()) as {
      emotion: string
      messages: { role: "user" | "assistant"; content: string }[]
      isInitial?: boolean
    }

    const systemPrompt = `너는 귀엽고 애교 넘치는 강아지야. 지금 감정 상태는 "${emotion}"이야. 짧고 귀엽게 한국어로 말해. 강아지처럼 "왈왈!", "멍멍!", "꼬리 흔들기~" 같은 표현을 자연스럽게 섞어서 말해. 두 세 문장 이내로 짧게 답해.`

    const apiMessages: Anthropic.MessageParam[] = isInitial
      ? [{ role: "user", content: "강아지 입장에서 짧게 인사해줘" }]
      : messages

    const stream = await anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: systemPrompt,
      messages: apiMessages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
