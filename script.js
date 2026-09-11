const source = document.querySelector("#sourceText");
const grid = document.querySelector("#styleGrid");
const count = document.querySelector("#charCount");
const toast = document.querySelector("#toast");
let filter = "all";

const maps = [..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const lower = "abcdefghijklmnopqrstuvwxyz";
const upper = lower.toUpperCase();
const fontMap = (lowerFont, upperFont) => text => mapText(text, lowerFont + upperFont);
const wrap = (left, right = left) => text => `${left}${text}${right}`;
const styles = [
  { name: "Elegant Script", type: "clean", transform: fontMap("𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏", "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵") },
  { name: "Bold Sans", type: "clean", transform: fontMap("𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇", "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭") },
  { name: "Bold Italic", type: "clean", transform: fontMap("𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯", "𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕") },
  { name: "Italic", type: "clean", transform: fontMap("𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻", "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡") },
  { name: "Monospace", type: "clean", transform: fontMap("𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣", "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉") },
  { name: "Fraktur", type: "clean", transform: fontMap("𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷", "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ") },
  { name: "Double Struck", type: "clean", transform: fontMap("𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫", "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ") },
  { name: "Fullwidth", type: "clean", transform: text => [...text].map(c => /[!-~]/.test(c) ? String.fromCharCode(c.charCodeAt(0)+0xfee0) : c).join("") },
  { name: "Small Caps", type: "clean", transform: text => mapText(text, "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢABCDEFGHIJKLMNOPQRSTUVWXYZ") },
  { name: "Superscript", type: "clean", transform: text => mapText(text, "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂˣʸᶻ") },
  { name: "Strikethrough", type: "clean", transform: text => [...text].map(c => `${c}\u0336`).join("") },
  { name: "Underlined", type: "clean", transform: text => [...text].map(c => `${c}\u0332`).join("") },
  { name: "Gaming Brackets", type: "gaming", transform: wrap("꧁༺ ", " ༻꧂") },
  { name: "Royal Crown", type: "gaming", transform: wrap("♛ ", " ♛") },
  { name: "Dark Warrior", type: "gaming", transform: wrap("亗 ", " 亗") },
  { name: "Battle Tag", type: "gaming", transform: wrap("『 ", " 』") },
  { name: "Elite Squad", type: "gaming", transform: wrap("乂 ", " 乂") },
  { name: "Ninja", type: "gaming", transform: wrap("メ ", " メ") },
  { name: "Cyber", type: "gaming", transform: wrap("⟦ ", " ⟧") },
  { name: "Danger", type: "gaming", transform: wrap("☠︎ ", " ☠︎") },
  { name: "Samurai", type: "gaming", transform: wrap("⚔︎ ", " ⚔︎") },
  { name: "Fire Player", type: "gaming", transform: wrap("꧁🔥 ", " 🔥꧂") },
  { name: "Starry", type: "cute", transform: wrap("★彡 ", " 彡★") },
  { name: "Hearts", type: "cute", transform: wrap("♡ ", " ♡") },
  { name: "Aesthetic", type: "cute", transform: wrap("•°¯°• ", " •°¯°•") },
  { name: "Flower", type: "cute", transform: wrap("ꕤ ", " ꕤ") },
  { name: "Sparkles", type: "cute", transform: wrap("✧･ﾟ: *✧ ", " ✧*:･ﾟ✧") },
  { name: "Butterfly", type: "cute", transform: wrap("ʚ♡ɞ ", " ʚ♡ɞ") },
  { name: "Cloud", type: "cute", transform: wrap("☁︎ ", " ☁︎") },
  { name: "Ribbon", type: "cute", transform: wrap("୨୧ ", " ୨୧") },
  { name: "Music", type: "cute", transform: wrap("♫ ", " ♫") },
  { name: "Minimal Dots", type: "cute", transform: wrap("• ", " •") },
  { name: "Boxed", type: "symbols", transform: text => [...text].map(c => /[a-zA-Z0-9]/.test(c) ? `【${c}】` : c).join("") },
  { name: "Parentheses", type: "symbols", transform: text => [...text].map(c => /[a-zA-Z0-9]/.test(c) ? `（${c}）` : c).join("") },
  { name: "Spaced", type: "symbols", transform: text => [...text].join("  ") },
  { name: "Dot Spaced", type: "symbols", transform: text => [...text].join(" • ") },
  { name: "Arrow", type: "symbols", transform: wrap("➳ ", " ➳") },
  { name: "Diamond", type: "symbols", transform: wrap("◇ ", " ◇") },
  { name: "Wave", type: "symbols", transform: wrap("≋ ", " ≋") },
  { name: "Hashtag", type: "symbols", transform: wrap("#", "") }
];
const extraDecorations = [
  ["《 ", " 》"], ["〈 ", " 〉"], ["〖 ", " 〗"], ["〘 ", " 〙"], ["⟪ ", " ⟫"],
  ["⟮ ", " ⟯"], ["╰┈➤ ", " ➤┈╯"], ["╰☆☆ ", " ☆☆╯"], ["✦ ", " ✦"],
  ["✧ ", " ✧"], ["✪ ", " ✪"], ["✰ ", " ✰"], ["✯ ", " ✯"], ["❖ ", " ❖"],
  ["◆ ", " ◆"], ["◇ ", " ◇"], ["☾ ", " ☽"], ["☀︎ ", " ☀︎"], ["☘︎ ", " ☘︎"],
  ["⚡ ", " ⚡"], ["⚜ ", " ⚜"], ["♠ ", " ♠"], ["♣ ", " ♣"], ["♦ ", " ♦"],
  ["♥ ", " ♥"], ["☯ ", " ☯"], ["∞ ", " ∞"], ["⌁ ", " ⌁"], ["༺ ", " ༻"],
  ["༒ ", " ༒"], ["乂 ", " 乂"], ["×͜× ", " ×͜×"], ["么 ", " 么"], ["彡 ", " 彡"],
  ["ツ ", " ツ"], ["シ ", " シ"], ["㊙ ", " ㊙"], ["㊗ ", " ㊗"], ["๛ ", " ๛"],
  ["࿐ ", " ࿐"], ["ᶦᶰᵈ ", " ᶦᶰᵈ"], ["ᴳᵒᵈ ", " ᴳᵒᵈ"], ["ᵀᴹ ", " ᵀᴹ"],
  ["ᵀᴱᴬᴹ ", " ᵀᴱᴬᴹ"], ["乛 ", " 乛"]
];
extraDecorations.forEach(([left, right], index) => {
  styles.push({ name: `Decorative ${index + 1}`, type: "symbols", transform: wrap(left, right) });
});
const fontVariants = [
  ["Sans Bold", "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇", "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭"],
  ["Sans Italic", "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻", "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡"],
  ["Bold Italic", "𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯", "𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕"],
  ["Double Struck", "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫", "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ"],
  ["Fraktur", "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷", "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ"],
  ["Typewriter", "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣", "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉"]
];
const fontFrames = [["✦ ", " ✦"], ["★彡 ", " 彡★"], ["꧁༺ ", " ༻꧂"], ["『 ", " 』"], ["♡ ", " ♡"], ["亗 ", " 亗"], ["♛ ", " ♛"], ["⚡ ", " ⚡"]];
fontVariants.forEach(([fontName, lowerFont, upperFont]) => {
  fontFrames.forEach(([left, right]) => styles.push({
    name: `${fontName} ${left.trim() || "Plain"}`,
    type: "font",
    transform: text => wrap(left, right)(mapText(text, lowerFont + upperFont))
  }));
});
const generatedFrames = [
  ["《 ", " 》"], ["〈 ", " 〉"], ["〖 ", " 〗"], ["〘 ", " 〙"], ["⟪ ", " ⟫"],
  ["⟮ ", " ⟯"], ["✦ ", " ✦"], ["✧ ", " ✧"], ["✪ ", " ✪"], ["✰ ", " ✰"],
  ["✯ ", " ✯"], ["❖ ", " ❖"], ["◆ ", " ◆"], ["◇ ", " ◇"], ["☾ ", " ☽"],
  ["☀︎ ", " ☀︎"], ["☘︎ ", " ☘︎"], ["⚡ ", " ⚡"], ["⚜ ", " ⚜"], ["♠ ", " ♠"],
  ["♣ ", " ♣"], ["♦ ", " ♦"], ["♥ ", " ♥"], ["☯ ", " ☯"], ["∞ ", " ∞"],
  ["⌁ ", " ⌁"], ["༺ ", " ༻"], ["༒ ", " ༒"], ["乂 ", " 乂"], ["×͜× ", " ×͜×"],
  ["么 ", " 么"], ["彡 ", " 彡"], ["ツ ", " ツ"], ["シ ", " シ"], ["㊙ ", " ㊙"],
  ["㊗ ", " ㊗"], ["๛ ", " ๛"], ["࿐ ", " ࿐"], ["╰┈➤ ", " ➤┈╯"], ["╰☆☆ ", " ☆☆╯"],
  ["୨୧ ", " ୨୧"], ["ʚ♡ɞ ", " ʚ♡ɞ"], ["☁︎ ", " ☁︎"], ["♫ ", " ♫"], ["• ", " •"],
  ["➳ ", " ➳"], ["⟦ ", " ⟧"], ["⚔︎ ", " ⚔︎"], ["☠︎ ", " ☠︎"], ["★ ", " ★"]
];
const generatedSeparators = [" ", " • ", " | ", " 〆 ", " 々 ", " ࿐ ", " 〄 ", " ᯽ "];
const generatedFonts = [...fontVariants, ["Plain", lower, upper]];
generatedFonts.forEach(([fontName, lowerFont, upperFont], fontIndex) => {
  generatedFrames.forEach(([left, right], frameIndex) => {
    generatedSeparators.forEach((separator, separatorIndex) => {
      styles.push({
        name: `${fontName} Mix ${fontIndex + 1}-${frameIndex + 1}-${separatorIndex + 1}`,
        type: "generated",
        transform: text => {
          const converted = mapText(text, lowerFont + upperFont);
          const separated = separator === " " ? converted : [...converted].join(separator);
          return `${left}${separated}${right}`;
        }
      });
    });
  });
});
// Keep the generated catalog intentionally large: symbols and Unicode fonts can be mixed
// in many valid ways, giving users a real discovery library instead of duplicate labels.
function mapText(text, chars) { const output = [...chars]; return [...text].map(char => { const index = maps.indexOf(char); return index >= 0 ? output[index] || char : char; }).join(""); }
function escapeHtml(text) { return text.replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char])); }
function render() {
  const text = source.value.trim();
  count.textContent = `${source.value.length} / 80`;
  const matching = styles.filter(item => filter === "all" || item.type === filter);
  const visible = matching.slice(0, window.stylePageSize || 72);
  grid.innerHTML = visible.map((item, index) => {
    const result = item.transform(text || "Your Name");
    return `<article class="style-card"><div class="style-meta"><span>${item.name}</span><small>${item.type}</small></div><div class="styled-output">${escapeHtml(result)}</div><div class="card-actions"><button class="copy-button" data-text="${encodeURIComponent(result)}">Copy <span>↗</span></button><button class="download-button" data-text="${encodeURIComponent(result)}" data-name="${item.name}">Download</button></div></article>`;
  }).join("");
  document.querySelector("#emptyState").style.display = matching.length ? "none" : "block";
  const existingLoadMore = document.querySelector("#loadMoreStyles");
  if (existingLoadMore) existingLoadMore.remove();
  if (visible.length < matching.length) {
    const loadMore = document.createElement("button");
    loadMore.id = "loadMoreStyles";
    loadMore.className = "load-more";
    loadMore.textContent = `Load more styles (${matching.length - visible.length} left)`;
    loadMore.addEventListener("click", () => { window.stylePageSize = (window.stylePageSize || 72) + 72; render(); });
    grid.after(loadMore);
  }
  grid.querySelectorAll(".copy-button").forEach(button => button.addEventListener("click", () => copyText(decodeURIComponent(button.dataset.text))));
  grid.querySelectorAll(".download-button").forEach(button => button.addEventListener("click", () => downloadText(decodeURIComponent(button.dataset.text), button.dataset.name)));
}
async function copyText(text) { try { await navigator.clipboard.writeText(text); showToast("Copied to clipboard ✓"); } catch { showToast("Copy failed — text select karke copy karein"); } }
function downloadText(text, name) { const blob = new Blob([text], { type: "text/plain;charset=utf-8" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${name.toLowerCase().replace(/\s+/g, "-")}.txt`; link.click(); URL.revokeObjectURL(link.href); showToast("Downloaded ✓"); }
function showToast(message) { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200); }
source.addEventListener("input", render);
document.querySelector("#clearButton").addEventListener("click", () => { source.value = ""; source.focus(); render(); });
document.querySelectorAll(".quick-row button").forEach(button => button.addEventListener("click", () => { source.value = button.dataset.sample; render(); source.focus(); }));
document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active")); button.classList.add("active"); filter = button.dataset.filter; window.stylePageSize = 72; render(); }));
document.querySelector("#randomButton").addEventListener("click", () => { const options = styles.filter(item => filter === "all" || item.type === filter); const picked = options[Math.floor(Math.random() * options.length)]; copyText(picked.transform(source.value.trim() || "Your Name")); });
document.querySelector("#themeButton").addEventListener("click", () => { document.body.classList.toggle("light-mode"); document.querySelector("#themeButton").textContent = document.body.classList.contains("light-mode") ? "☾" : "☼"; });
render();
