import { initFirebase } from "./firebaseConfig.js";
import { signOut } 
  from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Initialize Firebase ONCE
let currentUser = null;
let auth = null;

(async () => {
  try {
    const firebase = await initFirebase();
    auth = firebase.auth;

    firebase.onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.replace("/LOGIN_PAGE.html");
        return;
      }

      currentUser = user;

      // ✅ UPDATE UI HERE
      const nameEl = document.getElementById("userName");
      if (nameEl) {
        nameEl.textContent =
          user.displayName ||
          extractNameFromEmail(user.email) ||
          "User";
      }

      console.log("AUTH USER:", user);
    });

  } catch (err) {
    console.error("Firebase init failed", err);
  }
})();


let purchasedArrayOfArray = [];
let globalGuitarsData = [];
let quantityArrayOfArray = [];
let globalAllGuitars = [];     
let currentlySelectedFilterColor = null;
let currentMinPrice = 0;
let currentMaxPrice = Infinity;
let selectedShapes = new Set();
let selectedMaterials = new Set();
let selectedBodyFinishes = new Set();
let selectedCases = new Set();


function extractNameFromEmail(email) {
  if (!email) return null;

  return email
    .split("@")[0]
    .replace(/[0-9]/g, "")
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}


document.addEventListener("DOMContentLoaded", async () => {

  const profileIcon = document.getElementById("profile_me");
  const profilePopup = document.getElementById("profilePopup");
  const signOutBtn = document.getElementById("signOutBtn");

  profileIcon.addEventListener("click", (e) => {
    e.stopPropagation();

    profilePopup.style.display =
      profilePopup.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", () => {
    profilePopup.style.display = "none";
  });

  profilePopup.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  signOutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("/LOGIN_PAGE.html");
  });

  console.log("AUTH USER:", currentUser);


  document.querySelectorAll(".arrow_toggle").forEach(toggle => {

    toggle.addEventListener("click", () => {

        const face1 = toggle.closest(".face");
        const face2 = face1.nextElementSibling;

        document.querySelectorAll(".color_menu, .range_menu, .checkbox_menu").forEach(menu => {

            const otherFace2 = menu.querySelector(".face + .face2, .face + div");
            const otherToggle = menu.querySelector(".arrow_toggle");

            if (otherFace2 && otherFace2 !== face2)
            {
                otherFace2.classList.remove("active");
                otherFace2.style.maxHeight = null;
                if (otherToggle)
                {
                    otherToggle.classList.remove("rotate");
                }
            }
        });

        if (face2.classList.contains("active"))
        {
            face2.classList.remove("active");
            face2.style.maxHeight = null;
            toggle.classList.remove("rotate");
        }
        else
        {
            face2.classList.add("active");
            face2.style.maxHeight = face2.scrollHeight + "px";
            toggle.classList.add("rotate");
        }
    });
  });


  async function fetchColors()
  {
    try
    {
      const res = await fetch("/colors");
      const { colors } = await res.json();

      const colorRange = document.querySelector(".color_range");
      colorRange.innerHTML = "";

      colors.forEach((color) => {
        const cleanColor = color.replace(";", "");

        const circle = document.createElement("div");
        circle.className = "color";
        circle.style.backgroundColor = cleanColor;

        circle.addEventListener("click", () => {

          const normalized = cleanColor.trim().toLowerCase();

          if (currentlySelectedFilterColor === normalized) 
          {

            currentlySelectedFilterColor = null;
            resetToAllGuitars();

            document.querySelectorAll(".color_range .color").forEach(c => {
              c.style.outline = "none";
            });

            return;
          }

          currentlySelectedFilterColor = normalized;
          filterBySelectedColor(cleanColor);

          document.querySelectorAll(".color_range .color").forEach(c => {
            c.style.outline = "none";
          });

          circle.style.outline = "3px solid black";
        });


        colorRange.appendChild(circle);
      });
    }
    catch (err)
    {
      console.error("Error fetching colors:", err.message);
    }
  }

  fetchColors();


  function updateCartCount() 
  {
    const badge = document.getElementById("cartCount");
    if (!badge) return;

    const total = globalGuitarsData.reduce(
      (sum, item) => sum + (item.selectedQuantity || 0),
      0
    );

    badge.textContent = total;
    badge.style.display = total > 0 ? "flex" : "none";
  }



  async function fetchGuitars()
  {
    try
    {
      const res = await fetch("/api/guitars");

      if (!res.ok)
        throw new Error("Network response not ok");

      const guitarsData = await res.json();

      globalAllGuitars = guitarsData;  

      const divContainer = document.querySelector(".div_contain");
      divContainer.innerHTML = "";

      guitarsData.forEach((guitar, guitarIndex) => {

        const card = document.createElement("div");
        card.className = "card";

        const caseType = guitar.specs?.Case || guitar.Case || "None";

        let bannerText = "No bag";
        if (caseType.trim().toLowerCase() !== "none") 
        {
          bannerText = `Get a ${caseType}`;
        }

        const colorCircles = (guitar.colors || [])
          .map(
            (c, idx) =>
              `<div class="color"
                data-guitar-index="${guitarIndex}"
                data-color-index="${idx}"
                data-quantity="${c.quantity}"
                style="background-color: ${c.code}; ${
                idx === 0 ? "border: 2px solid #000;" : "border: 2px solid transparent;"
              }"></div>`
          )
          .join("");

        card.innerHTML = `
          <div class="image_container">
            <div class="image">
              <img src="${guitar.images[0]?.url || "placeholder.jpg"}"
                   alt="guitar"
                   data-guitar-index="${guitarIndex}">
            </div>
          </div>

          <div class="banner"><span>${bannerText}</span></div>

          <div class="bottom">
            <div class="details"><span>${guitar.name || "Unknown"}</span></div>

            <div class="Color_heading"><span>Color</span>${colorCircles}</div>

            <div class="wrapper">
              <label for="quantity">Quantity:</label>

              <div class="quantity" data-guitar-index="${guitarIndex}">
                <span class="minus">-</span>
                <span class="num">01</span>
                <span class="plus">+</span>
              </div>
            </div>

            <div class="cart" data-guitar-index="${guitarIndex}">
              <img src="cart_logo.png" alt="cart" width="35px" height="24px">
            </div>

            <div class="price"><span>MRP&nbsp;&nbsp;</span><span>₹ ${guitar.price ?? "-"}</span></div>
          </div>
        `;

        divContainer.appendChild(card);
        purchasedArrayOfArray[guitarIndex] = new Array(guitar.colors.length).fill(false);
        quantityArrayOfArray[guitarIndex] = new Array(guitar.colors.length).fill(1);
      });

      let quantities = guitarsData.map(() => 1);
      let selectedColors = guitarsData.map(() => 0);

      divContainer.addEventListener("click", (event) => {

        const target = event.target;

        const quantityBox = target.closest(".quantity");

        if (quantityBox)
        {
          const guitarIndex = parseInt(quantityBox.dataset.guitarIndex, 10);
          const numEl = quantityBox.querySelector(".num");
          const currentColorIndex = selectedColors[guitarIndex];
          const maxVal = guitarsData[guitarIndex].colors[currentColorIndex]?.quantity || 1;

          const currentQty = quantityArrayOfArray[guitarIndex][currentColorIndex];

          if (target.classList.contains("plus") && currentQty < maxVal) 
          {
            quantityArrayOfArray[guitarIndex][currentColorIndex]++;
          }
          else if (target.classList.contains("minus") && currentQty > 1) 
          {
            quantityArrayOfArray[guitarIndex][currentColorIndex]--;
          }

          numEl.innerText =
            quantityArrayOfArray[guitarIndex][currentColorIndex] < 10
              ? "0" + quantityArrayOfArray[guitarIndex][currentColorIndex]
              : quantityArrayOfArray[guitarIndex][currentColorIndex];


          const purchased = purchasedArrayOfArray[guitarIndex][currentColorIndex];

          if (purchased)
          {
            const guitar = guitarsData[guitarIndex];
            const selectedColor = guitar.colors[currentColorIndex];
            const itemId = `${guitar.id}_${selectedColor.code}`;

            globalGuitarsData = globalGuitarsData.filter(
              item => item.id !== itemId
            );

            purchasedArrayOfArray[guitarIndex][currentColorIndex] = false;

            const cartEl = divContainer.querySelector(
              `.cart[data-guitar-index="${guitarIndex}"]`
            );
            if (cartEl)
            {
              cartEl.innerHTML =
                `<img src="cart_logo.png" alt="cart" width="35px" height="24px">`;
            }

            updateCartCount();
            localStorage.setItem("globalGuitarsData", JSON.stringify(globalGuitarsData));
          }


          return;
        }

        const colorEl = target.closest(".color");

        if (colorEl)
        {
          const guitarIndex = parseInt(colorEl.dataset.guitarIndex, 10);
          const colorIndex = parseInt(colorEl.dataset.colorIndex, 10);

          selectedColors[guitarIndex] = colorIndex;

          // 🔥 FIX: update visual color selection
          const allColors = divContainer.querySelectorAll(
            `.color[data-guitar-index="${guitarIndex}"]`
          );

          allColors.forEach(c => {
            c.style.border = "2px solid transparent";
          });

          colorEl.style.border = "2px solid #000";


          const savedQty = quantityArrayOfArray[guitarIndex][colorIndex];

          const quantityBox = divContainer.querySelector(
            `.quantity[data-guitar-index="${guitarIndex}"] .num`
          );

          if (quantityBox) 
          {
            quantityBox.innerText =
              savedQty < 10 ? "0" + savedQty : savedQty;
          }


          const cart = divContainer.querySelector(`.cart[data-guitar-index="${guitarIndex}"]`);
          const isPurchased = purchasedArrayOfArray[guitarIndex][colorIndex];
          cart.innerHTML = isPurchased
            ? `<i class="fa-solid fa-check" style="font-size:28px;width:35px;height:28px;text-align:center;display:inline-block;"></i>`
            : `<img src="cart_logo.png" alt="cart" width="35px" height="24px">`;

          return;
        }

        const cartEl = target.closest(".cart");

        if (cartEl)
        {
          const guitarIndex = parseInt(cartEl.dataset.guitarIndex, 10);
          const colorIndex = selectedColors[guitarIndex];
          const purchased = purchasedArrayOfArray[guitarIndex];
          const guitar = guitarsData[guitarIndex];
          const selectedColor = guitar.colors[colorIndex];

          purchased[colorIndex] = !purchased[colorIndex];

          if (purchased[colorIndex])
          {
            const itemData = {
              id: `${guitar.id}_${selectedColor.code}`,
              guitarId: guitar.id,
              name: guitar.name,
              price: guitar.price,
              color: {
                code: selectedColor.code,
                quantity: selectedColor.quantity,
              },
              selectedQuantity: quantityArrayOfArray[guitarIndex][colorIndex],
              images: guitar.images
            };

            globalGuitarsData.push(itemData);

            cartEl.innerHTML = `<i class="fa-solid fa-check" style="font-size:28px;width:35px;height:28px;text-align:center;display:inline-block;"></i>`;
            updateCartCount();

          }
          else
          {
            globalGuitarsData = globalGuitarsData.filter(
              (item) => item.id !== `${guitar.id}_${selectedColor.code}`
            );
            cartEl.innerHTML = `<img src="cart_logo.png" alt="cart" width="35px" height="24px">`;
            updateCartCount();

          }

          localStorage.setItem("globalGuitarsData", JSON.stringify(globalGuitarsData));

          return;
        }

        const imageEl = target.closest(".image img");
        if (imageEl)
        {
          const guitarIndex = parseInt(imageEl.dataset.guitarIndex, 10);
          const guitar = guitarsData[guitarIndex];
          const guitarSlug = (guitar.name || "unknown").toLowerCase().replace(/\s+/g, "-");

          window.location.href = `/guitar/${guitar.id}/${guitarSlug}`;
        }
      });
    }
    catch (err)
    {
      console.error("Error fetching guitars:", err);
      document.querySelector(".div_contain").innerHTML =
        `<p style="color:red">Failed to load guitars. Check server console.</p>`;
    }
  }

  fetchGuitars();


  function toRgbString(colorStr) 
  {
    if (!colorStr) 
      return null;

    const clean = String(colorStr).trim().replace(/;$/g, "");

    const el = document.createElement("div");
    el.style.display = "none";
    el.style.backgroundColor = clean;

    document.body.appendChild(el);

    const computed = getComputedStyle(el).backgroundColor;
    document.body.removeChild(el);

    if (!computed) 
      return null;

    const m = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);

    if (!m) 
      return computed;

    const r = m[1], g = m[2], b = m[3], a = m[4];

    if (a === undefined || a === "1" || Number(a) === 1) 
    {
      return `rgb(${r}, ${g}, ${b})`;
    } 
    else 
    {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }


  function resetToAllGuitars() 
  {
    renderFilteredGuitars(globalAllGuitars);
  }


  function filterBySelectedColor(selectedColor) 
  {
    if (!globalAllGuitars.length) 
      return;

    const targetColor = toRgbString(selectedColor);
    if (!targetColor) 
      return;

    const filtered = globalAllGuitars.filter(guitar =>
      guitar.colors.some(c => {

        const colorCode = toRgbString(c.code || c.color || "");

        return colorCode && colorCode === targetColor;
      })
    );

    renderFilteredGuitars(filtered);
  }


  function getNormalizedGuitarShape(g) 
  {
    const possible = [
      g.shape,
      g.Body_Shape,
      g.body_shape,
      g.bodyShape,
      g.type,
      g.category,
      g.modelType
    ];


    for (const p of possible) 
    {
      if (typeof p === "string" && p.trim().length > 0) 
      {
        return p.trim().toLowerCase();
      }
    }

    if (g.details && typeof g.details.Body_Shape === "string") 
    {
      return g.details.Body_Shape.trim().toLowerCase();
    }

    return ""; 
  }


  function getNormalizedGuitarMaterial(g) 
  {
    const candidates = [
      g.Top_Material,
      g.top_material,
      g.topMaterial,
      g.Material,
      g.material,
      g.details?.Top_Material,
      g.details?.["Top Material"]   
    ];

    for (const m of candidates) 
    {
      if (typeof m === "string" && m.trim().length > 0) 
      {
        return m.trim().toLowerCase();
      }
    }

    return "";
  }


  function getNormalizedBodyFinish(g) {

    const candidates = [
      g.Body_Finish,
      g.body_finish,
      g.finishType,
      g.details?.Body_Finish,
      g.details?.["Body Finish"],
      g.specs?.Body_Finish,
      g.specs?.["Body Finish"]        
    ];

    for (const f of candidates) 
    {
      if (typeof f === "string" && f.trim().length > 0) 
      {
        return f.trim().toLowerCase();
      }
    }

    return "";
  }


  function getNormalizedCase(g) 
  {
    const candidates = [
      g.Case,
      g.case,
      g.specs?.Case,
      g.specs?.["Case"]
    ];

    for (const c of candidates) 
    {
      if (typeof c === "string" && c.trim().length > 0) 
      {
        return c.trim().toLowerCase();
      }
    }
    return "";
  }


  function applyAllFilters() 
  {
    if (!globalAllGuitars || !globalAllGuitars.length) 
    {
      renderFilteredGuitars([]);

      return;
    }

    let result = [...globalAllGuitars];


    // COLOR FILTER
    if (currentlySelectedFilterColor !== null) 
    {
      const target = toRgbString(currentlySelectedFilterColor);
      if (target) 
      {
        result = result.filter(g =>
          (g.colors || []).some(c => {
            try 
            {
              return toRgbString(c.code || c.color || "") === target;
            } 
            catch 
            {
              return false;
            }
          })
        );
      }
    }


    // PRICE FILTER
    result = result.filter(g => {

      const price = Number(g.price) || 0;

      return price >= (Number(currentMinPrice) || 0) && price <= (Number(currentMaxPrice) || Infinity);
    });


    // SHAPE FILTER (multiple selection)
    if (selectedShapes.size > 0) 
    {
      result = result.filter(g => {

        const shape = getNormalizedGuitarShape(g);
        if (!shape) 
          return false;
        
        for (const sel of selectedShapes) 
        {
          if (shape === String(sel).trim().toLowerCase()) 
            return true;
        }
        return false;
      });
    }


    // MATERIAL FILTER (multiple)
    if (selectedMaterials.size > 0) 
    {
      result = result.filter(g => {

        const material = getNormalizedGuitarMaterial(g);
        if (!material) 
          return false;
        
        for (const sel of selectedMaterials) 
        {
          if (material === String(sel).trim().toLowerCase()) 
            return true;
        }
        return false;
      });
    }


    // BODY FINISH FILTER
    if (selectedBodyFinishes.size > 0) 
    {
      result = result.filter(g => {

        const finish = getNormalizedBodyFinish(g);
        if (!finish) 
          return false;
        
        for (const sel of selectedBodyFinishes) 
        {
          if (finish === String(sel).trim().toLowerCase()) 
            return true;
        }
        return false;
      });
    }


    // CASE FILTER
    if (selectedCases.size > 0) 
    {
      result = result.filter(g => {
        
        const caseType = getNormalizedCase(g);
        return caseType && selectedCases.has(caseType);
      });
    }

    renderFilteredGuitars(result);
  }


  function renderFilteredGuitars(guitars) 
  {
    const divContainer = document.querySelector(".div_contain");
    divContainer.innerHTML = "";

    guitars.forEach((guitar, guitarIndex) => {

      const card = document.createElement("div");
      card.className = "card";

      const colorCircles = (guitar.colors || [])
        .map(
          (c, idx) =>
            `<div class="color"
              data-guitar-index="${guitarIndex}"
              data-color-index="${idx}"
              data-quantity="${c.quantity}"
              style="background-color: ${c.code}; ${
              idx === 0 ? "border: 2px solid #000;" : "border: 2px solid transparent;"
            }"></div>`
        )
        .join("");

      card.innerHTML = `
        <div class="image_container">
          <div class="image">
            <img src="${guitar.images[0]?.url || "placeholder.jpg"}"
                 alt="guitar"
                 data-guitar-index="${guitarIndex}">
          </div>
        </div>

        <div class="banner"><span>Get a Carry Bag</span></div>

        <div class="bottom">
          <div class="details"><span>${guitar.name}</span></div>

          <div class="Color_heading"><span>Color</span>${colorCircles}</div>

          <div class="wrapper">
            <label for="quantity">Quantity:</label>
            <div class="quantity" data-guitar-index="${guitarIndex}">
              <span class="minus">-</span>
              <span class="num">01</span>
              <span class="plus">+</span>
            </div>
          </div>

          <div class="cart" data-guitar-index="${guitarIndex}">
            <img src="cart_logo.png" alt="cart" width="35px" height="24px">
          </div>

          <div class="price"><span>MRP&nbsp;&nbsp;</span><span>₹ ${guitar.price}</span></div>
        </div>
      `;

      divContainer.appendChild(card);
    });
  }


  async function fetchRangeMax() 
  {
    const rangeMenu = document.querySelector(".range_menu");
    const rangeInput = rangeMenu.querySelectorAll(".range-input input");
    const progress = rangeMenu.querySelector(".slider .progress");
    const priceInput = rangeMenu.querySelectorAll(".price-input input");

    const priceGap = 10000; // REQUIRED MINIMUM GAP

    try 
    {
      const res = await fetch("/range");
      const { maximum_Value } = await res.json();

      
      const inputMin = document.querySelector(".input-min");
      const inputMax = document.querySelector(".input-max");
      inputMin.min = 0;
      inputMin.max = maximum_Value;
      inputMin.value = 0;

      inputMax.min = 0;
      inputMax.max = maximum_Value;
      inputMax.value = maximum_Value;

      // Range sliders
      const rangeMin = document.querySelector(".range-min");
      const rangeMax = document.querySelector(".range-max");

      rangeMin.min = 0;
      rangeMin.max = maximum_Value;
      rangeMin.value = inputMin.value;


      rangeMax.min = 0;
      rangeMax.max = maximum_Value;
      rangeMax.value = inputMax.value;


      currentMinPrice = Number(inputMin.value);
      currentMaxPrice = Number(inputMax.value);


      function updateProgress(minVal, maxVal) 
      {
        progress.style.left  = (minVal / maximum_Value) * 100 + "%";
        progress.style.right = 100 - (maxVal / maximum_Value) * 100 + "%";
      }

      updateProgress(currentMinPrice, currentMaxPrice);

      // RANGE SLIDERS
      rangeInput.forEach((slider) => {

        slider.addEventListener("input", (e) => {

          let minVal = parseInt(rangeMin.value);
          let maxVal = parseInt(rangeMax.value);

          if (maxVal - minVal < priceGap) 
          {
            if (e.target.classList.contains("range-min")) 
            {
              rangeMin.value = maxVal - priceGap;
              minVal = maxVal - priceGap;
            } 
            else 
            {
              rangeMax.value = minVal + priceGap;
              maxVal = minVal + priceGap;
            }
          }

          inputMin.value = minVal;
          inputMax.value = maxVal;

          currentMinPrice = minVal;
          currentMaxPrice = maxVal;
          updateProgress(minVal, maxVal);

          applyAllFilters();
        });
      });


      priceInput.forEach((box) => {

        box.addEventListener("input", () => {

          let minVal = parseInt(inputMin.value) || 0;
          let maxVal = parseInt(inputMax.value) || maximum_Value;


          if (maxVal - minVal < priceGap) 
          {
            if (box.classList.contains("input-min")) 
            {
              minVal = maxVal - priceGap;
              inputMin.value = minVal;
            } 
            else 
            {
              maxVal = minVal + priceGap;
              inputMax.value = maxVal;
            }
          }

          if (minVal < 0) 
            minVal = 0;
          if (maxVal > maximum_Value) 
            maxVal = maximum_Value;

          rangeMin.value = minVal;
          rangeMax.value = maxVal;

          currentMinPrice = minVal;
          currentMaxPrice = maxVal;
          updateProgress(minVal, maxVal);

          applyAllFilters();
        });
      });

    } 
    catch (err) 
    {
      console.log("Error in max price fetch", err.message);
    }
  }

  fetchRangeMax();


  async function fetchShapes() 
  {
    try 
    {
      const res = await fetch("/shapes");
      const { shapes } = await res.json();

      const shapeRange = document.querySelector(".body-shape_menu .face2");
      shapeRange.innerHTML = "";

      shapes.forEach((shape, index) => {

        if (!shape.trim()) 
          return;

        const optionDiv = document.createElement("div");
        optionDiv.className = "option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `shape_option_${index}`;

        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.innerText = shape;

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);

        shapeRange.appendChild(optionDiv);
      }); 

      shapeRange.querySelectorAll("input[type='checkbox']").forEach(chk => {

        chk.addEventListener("change", () => {

          const shapeLabel = chk.nextElementSibling.innerText.trim().toLowerCase();

          if (chk.checked) 
          {
            selectedShapes.add(shapeLabel);
          } 
          else 
          {
            selectedShapes.delete(shapeLabel);
          }

          applyAllFilters();
        });
      });

    } 
    catch (err) 
    {
      console.error("Error fetching Shape Range:", err.message);
    }
  }

  fetchShapes();


  async function fetchMaterials() 
  {
    try 
    {
      const res = await fetch("/materials");
      const { materials } = await res.json();

      const materialRange = document.querySelector(".top-material_menu .face2");
      materialRange.innerHTML = "";

      materials.forEach((material, index) => {

        if (!material.trim()) 
          return;

        const optionDiv = document.createElement("div");
        optionDiv.className = "option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `material_option_${index}`;

        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.innerText = material;

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);

        materialRange.appendChild(optionDiv);
      });

      materialRange.querySelectorAll("input[type='checkbox']").forEach(chk => {

        chk.addEventListener("change", () => {

          const materialLabel = chk.nextElementSibling.innerText.trim().toLowerCase();

          if 
          (chk.checked) 
          {
            selectedMaterials.add(materialLabel);
          } 
          else 
          {
            selectedMaterials.delete(materialLabel);
          }

          applyAllFilters();
        });
      });

    } 
    catch (err) 
    {
      console.error("Error fetching Material Range:", err.message);
    }
  }

  fetchMaterials();


  async function fetchBodyFinishes() 
  {
    try 
    {
      const res = await fetch("/bodyFinishes");
      const { bodyFinishes } = await res.json();

      const finishRange = document.querySelector(".body-finish_menu .face2");
      finishRange.innerHTML = "";

      bodyFinishes.forEach((finish, index) => {

        if (!finish.trim()) 
          return;

        const optionDiv = document.createElement("div");
        optionDiv.className = "option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `bodyFinish_option_${index}`;

        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.innerText = finish;

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);

        finishRange.appendChild(optionDiv);
      });

      finishRange.querySelectorAll("input[type='checkbox']").forEach(chk => {

        chk.addEventListener("change", () => {

          const finishLabel = chk.nextElementSibling.innerText.trim().toLowerCase();

          if (chk.checked) 
          {
            selectedBodyFinishes.add(finishLabel);
          } 
          else 
          {
            selectedBodyFinishes.delete(finishLabel);
          }

          applyAllFilters();
        });
      });

    } 
    catch (err) 
    {
      console.error("Error fetching body finishes:", err.message);
    }
  }

  fetchBodyFinishes();


  async function fetchCases() 
  {
    try 
    {
      const res = await fetch("/cases");
      const { cases } = await res.json();

      const caseRange = document.querySelector(".case_menu .face2");
      caseRange.innerHTML = "";

      cases.forEach((c, index) => {

        if (!c.trim()) 
          return;

        const optionDiv = document.createElement("div");
        optionDiv.className = "option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `case_option_${index}`;

        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.innerText = c;

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);

        caseRange.appendChild(optionDiv);
      });

      caseRange.querySelectorAll("input[type='checkbox']").forEach(chk => {
        
        chk.addEventListener("change", () => {

          const caseLabel = chk.nextElementSibling.innerText.trim().toLowerCase();

          if (chk.checked) 
          {
            selectedCases.add(caseLabel);
          } 
          else 
          {
            selectedCases.delete(caseLabel);
          }

          applyAllFilters();
        });
      });

    } 
    catch (err) 
    {
      console.error("Error fetching Cases:", err.message);
    }
  }

  fetchCases();
});