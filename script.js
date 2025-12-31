//handle submit function
//handle theme toggle
// handle delete btn
//generatre response api
//handle upload
// handle suggestions

const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileInput = document.querySelector("#file-input");
const cancelBtn = document.querySelector("#cancel-file-btn");
const addBtn = document.querySelector("#add-file-btn");
const stopBtn = document.querySelector("#stop-response-btn");
const chatsContainer = document.querySelector(".chats-container");
const themeBtn = document.querySelector("#theme-toggle-btn");

let typingEffect, controller;
const chatHistory = [];
const userData = {
  message: "",
  file: {},
};
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
const API_KEY = `AIzaSyAR1CuSLnmg8Y7qMWVlxZxIb6jsqm4JMEQ`;
//genereate api response
const generateApiResponse = async (botMessageDiv) => {
  const messageText = botMessageDiv.querySelector(".message-text");
  controller = new AbortController();
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },

      ...(userData?.file?.data
        ? [
            {
              inline_data: (({ isImage, name, ...rest }) => rest)(
                userData.file
              ),
            },
          ]
        : []),
    ],
  });
  const apiOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      contents: chatHistory,
    }),

    signal: controller.signal,
  };

  try {
    const response = await fetch(API_URL, apiOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const apiResponseText = data.candidates[0].content.parts[0].text.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    );

    handleTypingEffect(apiResponseText, messageText, botMessageDiv);

    chatHistory.push({
      role: "model",
      parts: [{ text: apiResponseText }],
    });
  } catch (err) {
    messageText.textContent =
      err.name === "AbortError" ? "Connection was terminated" : err.message;

    messageText.style.color = "red";
  } finally {
    userData.file = {};
  }
};

//create a div for message
const createMessageDiv = (text, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = text;
  return div;
};

const handleSubmit = (e) => {
  e.preventDefault();
  const userInupt = promptInput.value.trim();
  if (!userInupt) return;

  document.body.classList.add("bot-responding");
  const messageText = `<div class="message-text"></div>
  ${
    userData.file.data
      ? userData.file.isImage
        ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
        : `<p class="file-attachment" ><span class="material-symbols-rounded">attachment</span>${userData.file.name}</p>`
      : ""
  }

  `;
  const messageDiv = createMessageDiv(messageText, "user-message");
  userData.message = userInupt;
  messageDiv.querySelector(".message-text").textContent = userData.message;
  chatsContainer.appendChild(messageDiv);
  promptInput.value = "";
  document.body.classList.add("chats-active");
  setTimeout(() => {
    const messageText = `
    <img src="./google-gemini.svg" class="avatar"/>
    <div class="message-text">just a sec....</div>`;

    const botMessageDiv = createMessageDiv(
      messageText,
      "bot-message",
      "loading"
    );

    chatsContainer.appendChild(botMessageDiv);

    generateApiResponse(botMessageDiv);
  }, 600);
};
promptForm.addEventListener("submit", handleSubmit);

fileInput.addEventListener("change", () => {
  userData.file = {};
  const file = fileInput.files[0];

  const fileReader = new FileReader();

  fileReader.readAsDataURL(file);

  const isImage = file.type.startsWith("image/");
  console.log(isImage);

  fileReader.onload = (e) => {
    const data = e.target.result.split(",")[1];

    userData.file = {
      name: file.name,
      mime_type: file.type,
      data,
      isImage,
    };
    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add(
      "active",
      isImage ? "img-attached" : "file-attached"
    );
  };
});

addBtn.addEventListener("click", () => fileInput.click());

cancelBtn.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");
});
themeBtn.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-theme");

  localStorage.setItem("theme", isLight ? "light" : "dark");
  themeBtn.innerHTML = isLight ? "light_mode" : "dark_mode";
});

(() => {
  const savedTheme = localStorage.getItem("theme");

  const preferMode = window.matchMedia("(prefers-color-scheme: light)").matches;

  const isLight = savedTheme === "light" || (!savedTheme && preferMode);

  document.body.classList.toggle("light-theme", isLight);

  themeBtn.innerHTML = isLight ? "light_mode" : "dark_mode";
})();

document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");
  chatsContainer.innerHTML = "";
  document.body.classList.remove("chats-active");
});

document.querySelectorAll(".suggestions").forEach((item) => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;

    promptForm.dispatchEvent(new Event("submit"));
    document.body.classList.add("chats-active");
  });
});
const handleTypingEffect = (text, messageText, botMessageDiv) => {
  let counter = 0;
  const words = text.split(" ");

  typingEffect = setInterval(() => {
    if (counter < words.length) {
      messageText.textContent += `${words[counter++]} `;
      botMessageDiv.appendChild(messageText);
    } else {
      userData.file = {};
      clearInterval(typingEffect);
      botMessageDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
      fileUploadWrapper.classList.remove(
        "active",
        "file-attached",
        "img-attached"
      );
    }

    chatsContainer.appendChild(botMessageDiv);
  }, 60);
};

stopBtn.addEventListener("click", () => {
  controller?.abort();
  userData.file = {};
  clearInterval(typingEffect);
  chatsContainer
    .querySelector(".bot-message.loading")
    .classList.remove("loading");
  fileUploadWrapper.classList.remove("active", "file-attached", "img-attached");
  document.body.classList.remove("bot-responding");
});
