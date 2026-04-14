var links = [
  "https://discord.com/channels/1235103752369995796/1255782068529401897",
  "https://discord.com/channels/1235103752369995796/1336590129338388511",
  "https://discord.com/channels/1235103752369995796/1287216973620449340",
  "https://discord.com/channels/1235103752369995796/1235103752369995799",
  "https://discord.com/channels/1235103752369995796/1284176003698003968",
]

const initConfig = {
  mode: "fixed",
  hidden: true,
  content: {
    link: links[Math.floor(Math.random() * links.length)],
    welcome: ["Welcome hacker!"],
    touch: [
      "Happy Hacking!",
      "pwn the system!",
      "Meoww~~",
      "Stop poking me, it tickles! >///<",
      "Let's hack the planet!",
      "root@diana:~#",
      "sudo make me a sandwich",
      "chmod 777 cuteness",
      "Kernel panic! Just kidding~",
      "rm -rf boredom",
      "Exploit found: You! >///<",
      "/dev/null is lonely...",
      "Segmentation fault (cuteness dumped)",
      "Access granted!",
      "Buffer overflow of love! 💗"
    ],
    skin: ["Would you like to meet my sister?", "I have a good friend Mashi!"],
    custom: [
      { "selector": ".comment-form", "text": "Content Tooltip" },
      { "selector": ".list .postname", "type": "read" },
      { "selector": ".post-content a, .page-content a, .post a", "type": "link" }
    ],
  },
  night: "toggleNightMode()",
  model: [
    "live2d/diana/Diana.model3.json"
  ],
  tips: true
}

function load_idol() {
  console.log("[Diana] Starting to load Live2D model...")
  console.log("[Diana] Model path:", initConfig.model[0])
  try {
    pio_reference = new Paul_Pio(initConfig)
    pio_alignment = "left"
    pio_refresh_style()
    console.log("[Diana] Live2D initialization complete")
  } catch (error) {
    console.error("[Diana] Error loading Live2D:", error)
  }
}


var pio_reference
window.onload = load_idol

// onModelLoad function disabled - letting pio.js handle everything automatically
// function onModelLoad(model) {
//   console.log("[Diana Debug] Model loaded, using pio.js system with custom messages")
// }


var pio_reference
window.onload = load_idol
