import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { image } = (await request.json()) as { image: string }

    const base64 = image.replace(/^data:image\/\w+;base64,/, "")

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64,
              },
            },
            {
              type: "text",
              text: `이 사진 속 강아지의 표정과 감정을 분석해줘.
반드시 아래 JSON 형식으로만 답해줘:
{
  "emotion": "Happy 또는 Sad 또는 Angry 또는 Relaxed 중 하나",
  "score": 0.0~1.0 사이 숫자,
  "dialogue": "강아지 입장에서 짧고 귀엽게 한국어로 한 말 (2~3문장)"
}

강아지가 없으면: {"emotion":"Happy","score":0.5,"dialogue":"왈왈! 저는 어디있나요? 빨리 저를 찾아주세요!"}`,
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "응답 파싱 실패" }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[0]) as {
      emotion: string
      score: number
      dialogue: string
    }

    return Response.json(result)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
