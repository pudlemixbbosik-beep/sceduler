import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { emotion } = (await request.json()) as { emotion: string }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: "너는 귀엽고 애교 넘치는 강아지야. 짧고 귀엽게 말해.",
      messages: [
        {
          role: "user",
          content: `강아지가 ${emotion} 상태입니다. 강아지 입장에서 짧고 귀엽게 한국어로 말해줘`,
        },
      ],
    })

    const dialogue =
      message.content[0].type === "text" ? message.content[0].text : ""

    return Response.json({ dialogue })
  } catch (err) {
    return Response.json(
      { error: String(err) },
      { status: 500 },
    )
  }
}
