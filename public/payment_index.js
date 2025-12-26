function generateReferenceCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `REF-${datePart}-${randomPart}`;
}

let cartTotal;
let paymentItems;

document.addEventListener("DOMContentLoaded", () => {
  const refInput = document.getElementById("reference");
  const amountInput = document.getElementById("amount");
  const dateInput = document.getElementById("date");

  refInput.value = generateReferenceCode();

  cartTotal = localStorage.getItem("cart_total") || 0;
  paymentItems = JSON.parse(localStorage.getItem("payment_items"));

  amountInput.value = cartTotal;

  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
});

/* GENERATE PAYMENT LINK */
document.getElementById("paymentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const paymentData = {
    name: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    amount: cartTotal,
    date: document.getElementById("date").value,
    reference: document.getElementById("reference").value
  };

  try {
    const res = await fetch("/api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });

    const data = await res.json();
    const resultBox = document.getElementById("result");

    if (res.ok) {
      resultBox.innerHTML = `
        <p><strong>Payment Link Generated!</strong></p>
        <button id="openWhatsappBtn" data-url="${data.whatsappUrl}">
          Open WhatsApp
        </button>
      `;
    } else {
      alert(data.error || "Failed to create payment link");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while generating payment link!");
  }
});

/* HANDLE WHATSAPP + POPUP */
document.addEventListener("click", (e) => {
  if (e.target.id === "openWhatsappBtn") {
    const url = e.target.getAttribute("data-url");

    document.getElementById("loadingOverlay").classList.remove("hidden");

    window.location.href = url;

    setTimeout(() => {
      document.getElementById("loadingOverlay").classList.add("hidden");
      document.getElementById("paymentStatus").classList.remove("hidden");
    }, 3000);
  }
});

/* PAYMENT DONE */
document.getElementById("paymentDone").addEventListener("click", async () => {
  const reference = document.getElementById("reference").value;
  const phone = document.getElementById("phone").value.trim();
  const name = document.getElementById("customerName").value.trim();
  const totalAmount = Number(localStorage.getItem("payment_total")) || 0;

  const payload = {
    user_Id: reference,
    name: name,
    phone: phone,
    totalAmount: totalAmount,
    items: paymentItems
  };

  try {
    const res = await fetch("/api/completeOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) {
      alert("Error: " + (data.error || ""));
      return;
    }

    alert("Payment confirmed. Order saved and stock updated.");

    // Clear everything
    localStorage.removeItem("globalGuitarsData");
    localStorage.removeItem("payment_items");
    localStorage.removeItem("cart_total");
    localStorage.removeItem("payment_total");

    window.location.href = "manage.html";

  } catch (err) {
    console.error(err);
    alert("Server error. Try again.");
  }
});

/* PAYMENT CANCELLED */
document.getElementById("paymentCancelled").addEventListener("click", () => {
  alert("Payment Cancelled");
  document.getElementById("paymentStatus").classList.add("hidden");
  window.location.href = "index.html";
});
