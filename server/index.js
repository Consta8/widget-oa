const chatBox = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  input.value = "";
  addUserMessageToChat(message);
  await sendMessage(message);
});

function addUserMessageToChat(message) {
  const div = document.createElement("div");
  div.className = "chat-bubble user";
  div.innerText = message;
  chatBox.appendChild(div);
  scrollToBottom();
}

function addBotMessageToChat(message) {
  const div = document.createElement("div");
  div.className = "chat-bubble bot";
  div.innerText = message;
  chatBox.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage(message) {
  try {
    addBotMessageToChat("💬 Thinking...");

    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    // удалить "Thinking..." и вставить настоящий ответ
    const last = chatBox.querySelector(".chat-bubble.bot:last-child");
    if (data.content) {
      last.innerText = data.content;
    } else if (data.error) {
      last.innerText = "❌ Ошибка: " + data.error;
    } else {
      last.innerText = "🤷 Нет ответа от бота.";
    }

  } catch (err) {
    const last = chatBox.querySelector(".chat-bubble.bot:last-child");
    last.innerText = "⚠️ Сбой сети или сервера.";
    console.error("Chat error:", err);
  }
}
