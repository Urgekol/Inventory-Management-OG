let inventoryData = [];

document.addEventListener("DOMContentLoaded", () => {

  fetchInventory();

  document.getElementById("searchInput").addEventListener("input", function () {
    const q = this.value.toLowerCase().trim();

    const filtered = inventoryData.filter(item =>
      item.name.toLowerCase().includes(q)
    );

    renderTable(filtered);
  });
});


async function fetchInventory() 
{
  try 
  {
    const res = await fetch("http://localhost:5000/api/inventory");
    const json = await res.json();

    if (!json.success) 
    {
      console.error("Failed to load inventory");

      return;
    }

    inventoryData = json.data;

    renderTable(inventoryData);

  } 
  catch (err) 
  {
    console.error("Error fetching inventory", err);
  }
}


function renderTable(data) 
{
  const tableBody = document.getElementById("guitarTableBody");
  tableBody.innerHTML = "";

  data.forEach(item => {
    const tr = document.createElement("tr");

    const colorSquares = item.variants
      .map(v => `
        <span 
          class="color-box"
          data-qty="${v.quantity}"
          style="
            display:inline-block;
            width:18px;
            height:18px;
            background:${v.colour_code};
            border:1px solid #ccc;
            border-radius:4px;
            margin-right:5px;
            cursor:pointer;
            position:relative;
          ">
        </span>
      `)
      .join("");

    tr.innerHTML = `
      <td>
        <img src="${item.image_url}" alt="guitar"
        style="width:60px; height:60px; object-fit:cover;">
      </td>

      <td>${item.name}</td>

      <td>${item.price}</td>

      <td>${colorSquares}</td>

      <td>
        <button class="edit-btn" data-id="${item.id}"
          style="background:none; border:none; cursor:pointer; margin-right:10px; font-size:18px;">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>

        <button class="delete-btn" data-id="${item.id}"
          style="background:none; border:none; cursor:pointer; font-size:18px; color:red;">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  attachColorBoxEvents();
  attachActionButtons();
}


function attachColorBoxEvents() 
{
  const allBoxes = document.querySelectorAll(".color-box");

  allBoxes.forEach(box => {
    box.addEventListener("click", () => {
      const qty = box.getAttribute("data-qty");

      const existing = box.querySelector(".qty-tooltip");
      if (existing) 
      {
        existing.remove();

        return;
      }

      document.querySelectorAll(".qty-tooltip").forEach(t => t.remove());

      const tooltip = document.createElement("div");
      tooltip.classList.add("qty-tooltip");
      tooltip.textContent = "Qty: " + qty;
      tooltip.style.position = "absolute";
      tooltip.style.top = "22px";
      tooltip.style.left = "0px";
      tooltip.style.padding = "3px 6px";
      tooltip.style.background = "#333";
      tooltip.style.color = "#fff";
      tooltip.style.fontSize = "12px";
      tooltip.style.borderRadius = "4px";
      tooltip.style.whiteSpace = "nowrap";
      tooltip.style.zIndex = "20";

      box.appendChild(tooltip);
    });
  });
}


function attachActionButtons() 
{
  document.querySelectorAll(".edit-btn").forEach(btn => {

    btn.addEventListener("click", () => {

      const id = btn.getAttribute("data-id");
      window.location.href = `edit.html?id=${id}`;
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {

    btn.addEventListener("click", async () => {

      const id = btn.getAttribute("data-id");

      if (!confirm("Delete this guitar?")) 
        return;

      try 
      {
        const res = await fetch(`http://localhost:5000/api/inventory/${id}`, {
          method: "DELETE"
        });

        const json = await res.json();

        if (json.success) 
        {
          fetchInventory();
        } 
        else 
        {
          alert("Delete failed");
        }
      } 
      catch (err) 
      {
        console.error("Delete error", err);
      }
    });
  });
}
