import { SUGGESTIONS } from "./brain.js"

const log = document.getElementById("log")
const input = document.getElementById("input")
let dogName = "뽀식이"

function add(text, who) {
  const div = document.createElement("div")
  div.className = `msg ${who}`
  div.textContent = text
  log.appendChild(div)
  log.scrollTop = log.scrollHeight
}

function send(text) {
  text = text.trim()
  if (!text) return
  add(text, "me")
  if (askingName && !text.includes("이름")) {
    askingName = false
    const name = text.replace(/[!~?.]/g, "").replace(/(이에요|예요|입니다|이야|야|요)$/, "").trim().slice(0, 10)
    if (name) return window.pet.sendChat(`내 이름은 ${name}야`)
  }
  askingName = false
  window.pet.sendChat(text)
}

// Until the dog knows the owner's name, the first thing typed is taken as the name.
let askingName = false

window.pet.getSettings().then((s) => {
  dogName = s.name
  document.title = `${dogName}랑 대화하기`
  if (!s.ownerName) {
    askingName = true
    add(`왈! 처음 만났네요! 저는 ${dogName}예요 🐶 주인님 이름이 뭐예요? 이름만 써 주세요!`, "dog")
  } else {
    add(`왈! ${s.ownerName}님 안녕하세요! 하고 싶은 말을 써 주세요. 아래 버튼을 눌러도 돼요~`, "dog")
  }
})
window.pet.onSettings((s) => {
  dogName = s.name
  document.title = `${dogName}랑 대화하기`
})
window.pet.onChatReply((text) => add(text, "dog"))

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault()
  send(input.value)
  input.value = ""
  input.focus()
})
// One button per suggestion from the shared brain, so new tricks show up here by themselves.
const chips = document.getElementById("chips")
for (const label of SUGGESTIONS) {
  const b = document.createElement("button")
  b.type = "button"
  b.textContent = label
  b.addEventListener("click", () => send(label))
  chips.appendChild(b)
}
