document.addEventListener("DOMContentLoaded", async () => {
  const parts = window.location.pathname.split("/");
  const guitarSlug = parts[3]; 

  try 
  {
    const res = await fetch(`/api/guitars/${guitarSlug}`);
    const guitar = await res.json();

    console.log(guitar);
    

    if (!guitar || guitar.error) 
    {
      console.error("Guitar not found:", guitar?.error);
      return;
    }

    // image
    const imageDiv = document.querySelector(".main-image");
    if (guitar.images?.length > 0) 
    {
      imageDiv.innerHTML = `<img src="${guitar.images[0].url}" alt="${guitar.name}">`;
    }

    document.getElementById("guitar-name").textContent = guitar.name || "Unknown";
    document.getElementById("guitar-price").textContent = guitar.price || "N/A";


    const subtitleParts = [
      guitar.Body_Shape,
      guitar["Top Material"],
      guitar.Warranty,
    ].filter(Boolean);

    document.getElementById("guitar-subtitle").textContent = subtitleParts.join(" • ");

    // colors
    const colorContainer = document.querySelector(".color_range");
    const colorCircles = (guitar.colors || [])
      .map(
        (c, idx) =>
          `<div class="color ${idx === 0 ? "selected" : ""}" 
              data-id="${c.id}" 
              data-quantity="${c.quantity}" 
              style="background-color: ${c.code};">
          </div>`
      )
      .join("");
      
    colorContainer.innerHTML = colorCircles;

    document.querySelectorAll(".color").forEach(circle => {
      circle.addEventListener("click", () => {
        document.querySelectorAll(".color").forEach(c => c.classList.remove("selected"));
        circle.classList.add("selected");
      });
    });

    const specs = guitar.specs;
    const specContainer = document.querySelector(".specification");

    Object.entries(specs).forEach(([key, value]) => {

      if (!value) 
        return; 

      if (key.toLowerCase() === "id") 
        return;

      if (key.toLowerCase() === "case") 
        return;

      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div>${key}</div><div>${value}</div>`;

      specContainer.appendChild(row);
    });
    
  } 
  catch (err) 
  {
    console.error("Error loading guitar details:", err);
  }
});
