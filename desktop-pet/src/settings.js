const nameEl = document.getElementById("name")
const ownerEl = document.getElementById("owner")
const previewEl = document.getElementById("preview")
const soundEl = document.getElementById("sound")
const autoEl = document.getElementById("autoStart")
const sizeButtons = [...document.querySelectorAll("#size button")]

function render(s) {
  if (document.activeElement !== nameEl) nameEl.value = s.rawName
  if (document.activeElement !== ownerEl) ownerEl.value = s.ownerName || ""
  nameEl.placeholder = s.customPhoto ? "예: 초코" : "뽀식이"
  if (s.photo) previewEl.src = s.photo
  document.getElementById("reset").style.display = s.customPhoto ? "" : "none"
  soundEl.checked = s.sound
  autoEl.checked = s.autoStart
  sizeButtons.forEach((b) => b.classList.toggle("on", b.dataset.size === s.size))
}

window.pet.getSettings().then(render)
window.pet.onSettings(render)

let nameTimer = null
nameEl.addEventListener("input", () => {
  clearTimeout(nameTimer)
  nameTimer = setTimeout(() => window.pet.updateSettings({ name: nameEl.value }), 300)
})
let ownerTimer = null
ownerEl.addEventListener("input", () => {
  clearTimeout(ownerTimer)
  ownerTimer = setTimeout(() => window.pet.updateSettings({ ownerName: ownerEl.value.trim() }), 300)
})
soundEl.addEventListener("change", () => window.pet.updateSettings({ sound: soundEl.checked }))
autoEl.addEventListener("change", () => window.pet.updateSettings({ autoStart: autoEl.checked }))
sizeButtons.forEach((b) => b.addEventListener("click", () => window.pet.updateSettings({ size: b.dataset.size })))
document.getElementById("choose").addEventListener("click", () => window.pet.choosePhoto())
document.getElementById("reset").addEventListener("click", () => window.pet.resetPhoto())
