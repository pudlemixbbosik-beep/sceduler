export const runtime = "nodejs"

const HF_MODEL_URL =
  "https://api-inference.huggingface.co/models/Dewa/dog_emotion_v2"

async function callHuggingFace(imageBlob: Blob): Promise<Response> {
  return fetch(HF_MODEL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
    },
    body: imageBlob,
  })
}

export async function POST(request: Request) {
  try {
    const { image } = (await request.json()) as { image: string }

    const base64 = image.replace(/^data:image\/\w+;base64,/, "")
    const imageBlob = new Blob([Buffer.from(base64, "base64")], { type: "image/jpeg" })

    let res = await callHuggingFace(imageBlob)

    // HuggingFace free tier cold-start: retry once after 3s
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 3000))
      res = await callHuggingFace(imageBlob)
    }

    if (!res.ok) {
      const text = await res.text()
      return Response.json(
        { error: `HuggingFace error: ${text}` },
        { status: 500 },
      )
    }

    const results = (await res.json()) as { label: string; score: number }[]
    const top = results[0]

    return Response.json({ label: top.label, score: top.score })
  } catch (err) {
    return Response.json(
      { error: String(err) },
      { status: 500 },
    )
  }
}
