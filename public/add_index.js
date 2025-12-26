document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000";
  const maxQuantity = 100;

  const fileInput = document.getElementById("fileInput");
  const preview = document.getElementById("preview");
  const addGuitarBtn = document.getElementById("addGuitarBtn");
  const colorContainer = document.querySelector(".color-container");

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
  const previewBox = document.getElementById("colorPreview");
  const rgbText = document.getElementById("rgbText");

  const addedColors = new Set(); 

  const selectedColors = [];
  let selectedFiles = [];

  function updateSelectedColors(action, colorHex, quantity = 1) 
  {
    const hexUpper = colorHex.toUpperCase();

    if (action === "add") 
    {
      const existing = selectedColors.find(c => c.hex === hexUpper);

      if (!existing) 
      {
        selectedColors.push({ hex: hexUpper, quantity });
      }
    } 
    else if (action === "remove") 
    {
      const index = selectedColors.findIndex(c => c.hex === hexUpper);

      if (index !== -1) 
        selectedColors.splice(index, 1);
    } 
    else if (action === "updateQuantity") 
    {
      const color = selectedColors.find(c => c.hex === hexUpper);

      if (color) 
        color.quantity = quantity;
    }

    console.log("Selected Colors:", selectedColors);
  }


  function rgbToHex(r, g, b) 
  {
    return (
      "#" +
      [r, g, b]
        .map(x =>
          Math.round(Number(x) || 0)
            .toString(16)
            .padStart(2, "0")
        )
        .join("")
        .toUpperCase()
    );
  }


  const makeIdSafe = text => encodeURIComponent(String(text)).replace(/%/g, "_");
  const escapeHtml = s =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");


  function createColorCard(name, hex, rgb) 
  {
    const card = document.createElement("div");
    card.className = "color-card";
    card.style.position = "relative";

    const idSafe = makeIdSafe(`${name}-${hex}`);
    const currentCardCount = colorContainer.querySelectorAll(".color-card").length;
    const isFirstCard = currentCardCount === 0;

    card.innerHTML = `
      <div class="color-top">
        <div class="color-circle" style="background:${hex};"></div>
        <div class="color-info">
          <h3 class="color-name">${escapeHtml(name)}</h3>
          <span class="hex">${escapeHtml(hex)}</span>
          <p class="rgb">RGB: (${escapeHtml(rgb)})</p>
        </div>
      </div>
      <div class="color-quantity">
        <label for="quantity-${idSafe}">Quantity</label>
        <input 
          type="number" 
          id="quantity-${idSafe}" 
          min="1" 
          max="${maxQuantity}" 
          placeholder="1"
        >
      </div>
    `;


    if (!isFirstCard) 
    {
      const trashBtn = document.createElement("button");
      trashBtn.className = "trash-btn";
      trashBtn.title = "Delete Color";
      trashBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;

      Object.assign(trashBtn.style, {
        position: "absolute",
        top: "5px",
        right: "5px",
        border: "none",
        background: "transparent",
        color: "red",
        cursor: "pointer",
        fontSize: "16px",
      });

      trashBtn.addEventListener("click", () => {
        const hexUpper = hex.toUpperCase();
        addedColors.delete(hexUpper);

        updateSelectedColors("remove", hexUpper);
        card.remove();

        updateAddButton();
      });

      card.appendChild(trashBtn);
    }

    const quantityInput = card.querySelector(`#quantity-${idSafe}`);

    quantityInput.addEventListener("input", () => {
      let val = parseInt(quantityInput.value) || 0;

      if (val > maxQuantity || val < 1) 
      {
        alert(`Quantity must be between 1 and ${maxQuantity}. Resetting to 1.`);

        val = 1;
        quantityInput.value = "";
      }

      updateSelectedColors("updateQuantity", hex, val);
    });


    quantityInput.addEventListener("blur", () => {

      if (quantityInput.value.trim() === "") 
      {
        quantityInput.placeholder = "1";
        updateSelectedColors("updateQuantity", hex, 1);
      }
    });

    return card;
  }



  function updateAddButton() 
  {
    const plusBtn = document.querySelector(".plus-btn");

    if (plusBtn) 
      plusBtn.remove();

    const currentCardCount = colorContainer.querySelectorAll(".color-card").length;

    if (currentCardCount > 0 && currentCardCount < 4) 
    {
      const addColorBtn = document.createElement("button");
      addColorBtn.className = "plus-btn";
      addColorBtn.textContent = "+";

      addColorBtn.addEventListener("click", () => {
        overlay.style.display = "flex";
      });

      colorContainer.appendChild(addColorBtn);
    }
  }


  function updatePreview() 
  {
    const r = parseInt(redRange.value || 0, 10);
    const g = parseInt(greenRange.value || 0, 10);
    const b = parseInt(blueRange.value || 0, 10);

    redVal.textContent = r;
    greenVal.textContent = g;
    blueVal.textContent = b;

    const hex = rgbToHex(r, g, b);
    hexInput.value = hex;
    rgbText.textContent = `RGB(${r}, ${g}, ${b})`;
    previewBox.style.backgroundColor = hex;
  }


  [redRange, greenRange, blueRange].forEach(slider =>
    slider.addEventListener("input", updatePreview)
  );


  hexInput.addEventListener("input", () => {
    const hex = hexInput.value.trim();

    if (/^#([0-9A-Fa-f]{6})$/.test(hex)) 
    {
      const bigint = parseInt(hex.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;

      redRange.value = r;
      greenRange.value = g;
      blueRange.value = b;

      updatePreview();
    }
  });


  cancelBtn.addEventListener("click", () => {
    redRange.value = 128;
    greenRange.value = 128;
    blueRange.value = 128;

    updatePreview();

    overlay.style.display = "none";
  });


  fileInput.addEventListener("change", async e => {
    preview.innerHTML = "";
    colorContainer.innerHTML = "";
    addedColors.clear();

    selectedColors.length = 0;

    selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) 
    {
      colorContainer.innerHTML = `<p>No color detected yet</p>`;
      return;
    }

    selectedFiles.forEach((file) => {

      const img = document.createElement("img");

      img.src = URL.createObjectURL(file);
      img.style.maxWidth = "150px";
      img.style.borderRadius = "8px";
      img.style.marginTop = "10px";

      preview.appendChild(img);

    });

    const file = selectedFiles[0];
    const formData = new FormData();
    formData.append("image", file);

    const uploadBtn = document.querySelector(".upload-btn");

    if (uploadBtn) 
      uploadBtn.style.display = "none";

    try 
    {
      const response = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
      const result = await response.json();

      if (result.success && result.dominantColor) 
      {
        const { rgb, hex, name } = result.dominantColor;
        const hexUpper = hex.toUpperCase();

        if (!addedColors.has(hexUpper)) 
        {
          detectedColor = { rgb, hex, name };
          addedColors.add(hexUpper);

          const detectedCard = createColorCard(name, hex, Array.isArray(rgb) ? rgb.join(", ") : "N/A");
          colorContainer.appendChild(detectedCard);

          updateAddButton();
          updateSelectedColors("add", hexUpper, 1); 
        }
      } 
      else 
      {
        colorContainer.innerHTML = `<p>Color detection failed.</p>`;
      }
    } 
    catch (err) 
    {
      console.error("Upload error:", err);
      colorContainer.innerHTML = `<p>Error uploading image.</p>`;
    }
  });


  getColorBtn.addEventListener("click", async () => {

    const currentCardCount = colorContainer.querySelectorAll(".color-card").length;

    if (currentCardCount >= 4) 
    {
      overlay.style.display = "none";

      return;
    }

    const r = parseInt(redRange.value || 0, 10);
    const g = parseInt(greenRange.value || 0, 10);
    const b = parseInt(blueRange.value || 0, 10);

    let hex = hexInput.value.trim();

    if (!hex || !/^#([0-9A-Fa-f]{6})$/.test(hex)) 
      hex = rgbToHex(r, g, b);

    const hexUpper = hex.toUpperCase();

    if (addedColors.has(hexUpper)) 
    {
      console.log(`Duplicate color ${hexUpper} ignored`);
      overlay.style.display = "none";

      return;
    }

    try 
    {
      const res = await fetch(`${API_BASE}/color`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r, g, b, hex }),
      });

      const data = await res.json();

      if (data.success && data.color) 
      {
        const { name, hex: finalHex, rgb: rgbArr = [r, g, b] } = data.color;
        const finalHexUpper = (finalHex || hex).toUpperCase();

        if (!addedColors.has(finalHexUpper)) 
        {
          addedColors.add(finalHexUpper);
          const newCard = createColorCard(name, finalHexUpper, rgbArr.join(", "));
          colorContainer.appendChild(newCard);

          updateAddButton();
          updateSelectedColors("add", finalHexUpper);
        }
      }
    } 
    catch (err) 
    {
      console.error("Error fetching color name:", err);

      if (!addedColors.has(hexUpper)) 
      {
        addedColors.add(hexUpper);
        const newCard = createColorCard("Unknown", hexUpper, `${r}, ${g}, ${b}`);
        colorContainer.appendChild(newCard);

        updateAddButton();
        updateSelectedColors("add", hexUpper);
      }
    }


    redRange.value = 128;
    greenRange.value = 128;
    blueRange.value = 128;

    updatePreview();

    overlay.style.display = "none";
  });

  
  addGuitarBtn.addEventListener("click", async () => {

    if (selectedFiles.length === 0) 
    {
      alert("Please select images first!");
      
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("images", file));

    const generalBasic = {
      name: document.getElementById("nameOfGuitar")?.value || "",
      price: document.getElementById("price")?.value || ""
    };

    const generalColor = {
      color: selectedColors
    };

    const generalDetails = {
      topMaterial: document.getElementById("topMaterial")?.value || "",
      backNeckMaterial: document.getElementById("backNeckMaterial")?.value || "",
      fingerboardBridgeMaterial: document.getElementById("fingerboardBridgeMaterial")?.value || "",
      warranty: document.getElementById("warranty")?.value || "",
      bodyShape: document.getElementById("bodyShape")?.value || ""
    };

    const generalSpecs = {
      scaleLength: document.getElementById("scaleLength")?.value || "",
      bodyLength: document.getElementById("bodyLength")?.value || "",
      totalLength: document.getElementById("totalLength")?.value || "",
      bodyWidth: document.getElementById("bodyWidth")?.value || "",
      bodyDepth: document.getElementById("bodyDepth")?.value || "",
      nutWidth: document.getElementById("nutWidth")?.value || "",
      stringSpacing: document.getElementById("stringSpacing")?.value || "",
      sideMaterial: document.getElementById("sideMaterial")?.value || "",
      fingerBoardRadius: document.getElementById("fingerboardRadius")?.value || "",
      nutMaterial: document.getElementById("nutMaterial")?.value || "",
      saddleMaterial: document.getElementById("saddleMaterial")?.value || "",
      bridgePins: document.getElementById("bridgePins")?.value || "",
      tuner: document.getElementById("tuners")?.value || "",
      bodyBinding: document.getElementById("bodyBinding")?.value || "",
      soundholeInlay: document.getElementById("soundholeInlay")?.value || "",
      pickguard: document.getElementById("pickguard")?.value || "",
      bodyFinish: document.getElementById("bodyFinish")?.value || "",
      neckFinish: document.getElementById("neckFinish")?.value || "",
      electronics: document.getElementById("electronics")?.value || "",
      controls: document.getElementById("controls")?.value || "",
      connections: document.getElementById("connections")?.value || "",
      strings: document.getElementById("strings")?.value || "",
      accessories: document.getElementById("accessories")?.value || "",
      case: document.getElementById("case")?.value || ""
    };

    const guitarData = { generalBasic, generalColor, generalDetails, generalSpecs};

    formData.append("guitarData", JSON.stringify(guitarData));

    try 
    {
      const response = await fetch("http://localhost:5000/addGuitar", {
        method: "POST",
        body: formData    // this is the data
      });

      const data = await response.json();
      if (response.ok) 
      {
        alert("Guitar images uploaded successfully!");
        console.log("Uploaded:", data);  
      } 
      else 
      {
        alert("Upload failed: " + data.error);
      }
    } 
    catch (err) 
    {
      console.error("Error uploading:", err);
      alert("Error uploading images.");
    }

  });

  redRange.value = 128;
  greenRange.value = 128;
  blueRange.value = 128;
  
  updatePreview();
});
