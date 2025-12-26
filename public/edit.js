const urlParams = new URLSearchParams(window.location.search);
const guitarId = urlParams.get("id");


document.addEventListener("DOMContentLoaded", () => {
  loadGuitarData();

  document.getElementById("addColorBtn").onclick = () => {
    document.getElementById("colorPickerOverlay").style.display = "flex";
  };

  document.getElementById("cancelBtnMain").onclick = () => {
    window.location.href = "manage.html";
  };

  document.getElementById("saveBtn").onclick = saveChanges;

  colorPickerInit();
});


function updateAddColorVisibility() 
{
  const total = document.querySelectorAll(".color-card").length;
  const btn = document.getElementById("addColorBtn");

  if (total >= 4) 
    btn.style.display = "none";

  else btn.style.display = "block";
}


async function loadGuitarData() 
{
  try 
  {
    const res = await fetch(`http://localhost:5000/api/inventory/${guitarId}`);
    const json = await res.json();

    if (!json.success) 
    {
      alert("Failed to load guitar");

      return;
    }

    const g = json.data;

    document.getElementById("nameOfGuitar").value = g.name;
    document.getElementById("price").value = g.price;

    const d = g.details;
    document.getElementById("topMaterial").value = d["Top Material"];
    document.getElementById("backNeckMaterial").value = d["Back and Neck Material"];
    document.getElementById("fingerboardBridgeMaterial").value = d["Fingerboard and Bridge Material"];
    document.getElementById("warranty").value = d["Warranty"];
    document.getElementById("bodyShape").value = d["Body_Shape"];

    const s = g.specs;
    document.getElementById("scaleLength").value = s["Scale_Length"];
    document.getElementById("bodyLength").value = s["Body_Length"];
    document.getElementById("totalLength").value = s["Total_Length"];
    document.getElementById("bodyWidth").value = s["Body_Width"];
    document.getElementById("bodyDepth").value = s["Body_Depth"];
    document.getElementById("nutWidth").value = s["Nut_Width"];
    document.getElementById("stringSpacing").value = s["String_Spacing"];
    document.getElementById("sideMaterial").value = s["Side_Material"];
    document.getElementById("fingerboardRadius").value = s["Fingerboard_Radius"];
    document.getElementById("nutMaterial").value = s["Nut_Material"];
    document.getElementById("saddleMaterial").value = s["Saddle_Material"];
    document.getElementById("bridgePins").value = s["Bridge_Pins"];
    document.getElementById("tuners").value = s["Tuners"];
    document.getElementById("bodyBinding").value = s["Body_Binding"];
    document.getElementById("soundholeInlay").value = s["Soundhole_Inlay"];
    document.getElementById("pickguard").value = s["Pickguard"];
    document.getElementById("bodyFinish").value = s["Body_Finish"];
    document.getElementById("neckFinish").value = s["Neck_Finish"];
    document.getElementById("electronics").value = s["Electronics"];
    document.getElementById("controls").value = s["Controls"];
    document.getElementById("connections").value = s["Connections"];
    document.getElementById("strings").value = s["Strings"];
    document.getElementById("accessories").value = s["Accessories"];
    document.getElementById("case").value = s["Case"];

    const container = document.getElementById("colorContainer");
    container.innerHTML = "";

    // load existing colors
    g.colors.forEach(c => {
      addColorRow(c.colour_code, c.quantity, true);
    });

    updateAddColorVisibility();

  } 
  catch (err) 
  {
    console.error("Load error:", err);
  }
}


function addColorRow(code, qty, isExisting = false) 
{
  const container = document.getElementById("colorContainer");


  const existingColors = [...document.querySelectorAll(".color-code-input")].map(
    input => input.value.toLowerCase()
  );

  if (existingColors.includes(code.toLowerCase())) 
    return;


  if (existingColors.length >= 4) 
    return;


  const placeholderValue = isExisting ? qty : 1;


  const div = document.createElement("div");
  div.className = "color-card";

  div.innerHTML = `
    <div class="color-top">
      <div class="color-preview-box" style="background:${code};"></div>
      <input type="text" class="color-code-input" value="${code}">
    </div>

    <div class="color-quantity">
      <label>Quantity</label>
      <input 
        type="number" 
        class="color-qty-input" 
        placeholder="${placeholderValue}"
        min="1"
        max="100"
      >
    </div>

    <button class="deleteColorBtn">Remove</button>
  `;

  const deleteBtn = div.querySelector(".deleteColorBtn");


  const totalBeforeAppend = document.querySelectorAll(".color-card").length;

  if (isExisting && totalBeforeAppend === 0) 
  {
    div.classList.add("first-color-card");    // add the class
    deleteBtn.style.display = "none";
  } 
  else 
  {
    deleteBtn.onclick = () => {

      div.remove();

      updateAddColorVisibility();
    };
  }


  container.appendChild(div);
  updateAddColorVisibility();
}


function colorPickerInit() 
{
  const overlay = document.getElementById("colorPickerOverlay");
  const cancelBtn = document.getElementById("cancelBtn");
  const getColorBtn = document.getElementById("getColorBtn");

  const redRange = document.getElementById("redRange");
  const greenRange = document.getElementById("greenRange");
  const blueRange = document.getElementById("blueRange");

  const redVal = document.getElementById("redVal");
  const greenVal = document.getElementById("greenVal");
  const blueVal = document.getElementById("blueVal");

  const hexInput = document.getElementById("hexCode");
  const preview = document.getElementById("colorPreview");
  const rgbText = document.getElementById("rgbText");


  function rgbToHex(r, g, b) 
  {
    const h = x => x.toString(16).padStart(2, "0");
    return "#" + h(r) + h(g) + h(b);
  }

  function resetPicker() 
  {
    redRange.value = 128;
    greenRange.value = 128;
    blueRange.value = 128;
    hexInput.value = "#808080";

    updatePreview();
  }

  function updatePreview() 
  {
    const r = parseInt(redRange.value);
    const g = parseInt(greenRange.value);
    const b = parseInt(blueRange.value);

    redVal.textContent = r;
    greenVal.textContent = g;
    blueVal.textContent = b;

    const hex = rgbToHex(r, g, b);
    hexInput.value = hex;

    preview.style.backgroundColor = hex;
    rgbText.textContent = `RGB(${r}, ${g}, ${b})`;
  }

  redRange.addEventListener("input", updatePreview);
  greenRange.addEventListener("input", updatePreview);
  blueRange.addEventListener("input", updatePreview);

  hexInput.addEventListener("input", () => {

    let hex = hexInput.value.trim();
    if (!hex.startsWith("#")) 
      hex = "#" + hex;

    if (/^#([0-9A-F]{6})$/i.test(hex)) 
    {
      const val = parseInt(hex.substring(1), 16);
      redRange.value = (val >> 16) & 255;
      greenRange.value = (val >> 8) & 255;
      blueRange.value = val & 255;

      updatePreview();
    }
  });

  cancelBtn.addEventListener("click", () => {

    overlay.style.display = "none";

    resetPicker();
  });

  getColorBtn.addEventListener("click", async () => {
    const r = parseInt(redRange.value);
    const g = parseInt(greenRange.value);
    const b = parseInt(blueRange.value);
    const hex = hexInput.value;

    try 
    {
      const res = await fetch("/color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r, g, b, hex })
      });

      const json = await res.json();
      if (!json.success) 
        return;

      addColorRow(json.color.hex, 1, false);

      overlay.style.display = "none";
      resetPicker();

    } 
    catch (err) 
    {
      alert("Backend error");
    }
  });

  updatePreview();
}


async function saveChanges() 
{

  const rows = [...document.querySelectorAll(".color-card")];

  const colors = rows.map(row => {

    const code = row.querySelector(".color-code-input").value;

    let qtyInput = row.querySelector(".color-qty-input").value.trim();
    const placeholderQty = row.querySelector(".color-qty-input").placeholder;

    let qty;

    // empty -> use placeholder
    qty = qtyInput === "" ? placeholderQty : qtyInput;

    if (qty !== undefined) 
    {
      qty = parseInt(qty);

      if (qty > 100) 
      {
        alert("Quantity cannot be more than 100");
        row.querySelector(".color-qty-input").value = "";

        return;
      }

      if (qty < 1) 
      {
        alert("Quantity cannot be less than 1");
        row.querySelector(".color-qty-input").value = "";

        return;
      }
    }

    return {
      colour_code: code,
      quantity: qty
    };
  });

  const body = {
    name: document.getElementById("nameOfGuitar").value,
    price: document.getElementById("price").value,

    details: {
      "Top Material": document.getElementById("topMaterial").value,
      "Back and Neck Material": document.getElementById("backNeckMaterial").value,
      "Fingerboard and Bridge Material": document.getElementById("fingerboardBridgeMaterial").value,
      "Warranty": document.getElementById("warranty").value,
      "Body_Shape": document.getElementById("bodyShape").value
    },

    specs: {
      "Scale_Length": document.getElementById("scaleLength").value,
      "Body_Length": document.getElementById("bodyLength").value,
      "Total_Length": document.getElementById("totalLength").value,
      "Body_Width": document.getElementById("bodyWidth").value,
      "Body_Depth": document.getElementById("bodyDepth").value,
      "Nut_Width": document.getElementById("nutWidth").value,
      "String_Spacing": document.getElementById("stringSpacing").value,
      "Side_Material": document.getElementById("sideMaterial").value,
      "Fingerboard_Radius": document.getElementById("fingerboardRadius").value,
      "Nut_Material": document.getElementById("nutMaterial").value,
      "Saddle_Material": document.getElementById("saddleMaterial").value,
      "Bridge_Pins": document.getElementById("bridgePins").value,
      "Tuners": document.getElementById("tuners").value,
      "Body_Binding": document.getElementById("bodyBinding").value,
      "Soundhole_Inlay": document.getElementById("soundholeInlay").value,
      "Pickguard": document.getElementById("pickguard").value,
      "Body_Finish": document.getElementById("bodyFinish").value,
      "Neck_Finish": document.getElementById("neckFinish").value,
      "Electronics": document.getElementById("electronics").value,
      "Controls": document.getElementById("controls").value,
      "Connections": document.getElementById("connections").value,
      "Strings": document.getElementById("strings").value,
      "Accessories": document.getElementById("accessories").value,
      "Case": document.getElementById("case").value
    },

    colors
  };

  try {
    const res = await fetch(`http://localhost:5000/api/inventory/${guitarId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const json = await res.json();

    if (json.success) 
    {
      window.location.href = "manage.html";
    } 
    else 
    {
      alert("Update failed");
    }

  } 
  catch (err) 
  {
    console.error("Update error:", err);
  }
}
