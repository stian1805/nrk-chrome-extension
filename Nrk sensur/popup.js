const phrasesList = document.getElementById("phrasesList");
const newPhraseInput = document.getElementById("newPhrase");
const addBtn = document.getElementById("addBtn");

const loadPhrases = () => {
  chrome.storage.sync.get(["blockedPhrases"], (result) => {
    const phrases = result.blockedPhrases || [];
    renderPhrases(phrases);
  });
};

const renderPhrases = (phrases) => {
  phrasesList.innerHTML = "";
  if (phrases.length === 0) {
    phrasesList.innerHTML = "<p style='color: #999; margin: 0;'>Ingen fraser blokkert enda.</p>";
    return;
  }
  phrases.forEach((phrase, index) => {
    const item = document.createElement("div");
    item.className = "phrase-item";
    item.innerHTML = `
      <span class="phrase-text">${escapeHtml(phrase)}</span>
      <button class="remove-btn" data-index="${index}">Fjern</button>
    `;
    phrasesList.appendChild(item);
  });
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      removePhrase(parseInt(index));
    });
  });
};

const addPhrase = () => {
  const text = newPhraseInput.value.trim();
  if (!text) {
    return;
  }
  chrome.storage.sync.get(["blockedPhrases"], (result) => {
    let phrases = result.blockedPhrases || [];
    if (phrases.includes(text)) {
      return;
    }
    phrases.push(text);
    chrome.storage.sync.set({ blockedPhrases: phrases }, () => {
      newPhraseInput.value = "";
      loadPhrases();
    });
  });
};

const removePhrase = (index) => {
  chrome.storage.sync.get(["blockedPhrases"], (result) => {
    let phrases = result.blockedPhrases || [];
    phrases.splice(index, 1);
    chrome.storage.sync.set({ blockedPhrases: phrases }, () => {
      loadPhrases();
    });
  });
};

const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

addBtn.addEventListener("click", addPhrase);
newPhraseInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addPhrase();
  }
});

loadPhrases();
