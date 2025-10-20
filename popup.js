document.getElementById("runPython").addEventListener("click", () => {
  const button = document.getElementById("runPython");
  const loader = document.getElementById("loader");

  // Hide button and show loader
  button.style.display = "none";
  loader.style.display = "block";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;

    document.getElementById("result").innerHTML = "";
    document.getElementById("flag").innerText = "";

    fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: currentUrl })
    })
    .then(res => res.json())
    .then(data => {
      console.log("Response from server:", data);

      loader.style.display = "none"; // hide loader

      if (data.company_summary && data.recommendation) {
        let color = [128, 128, 128, 255]; 
        let flagBg = "#9E9E9E"; 
        if (data.recommendation === "BUY") { color = [0, 200, 0, 255]; flagBg = "#4CAF50"; }
        else if (data.recommendation === "SELL") { color = [200, 0, 0, 255]; flagBg = "#E53935"; }
        else if (data.recommendation === "HOLD") { color = [255, 165, 0, 255]; flagBg = "#FB8C00"; }

        chrome.runtime.sendMessage({
          type: "setBadge",
          recommendation: data.recommendation,
          color: color
        });

        document.getElementById("flag").innerText = `Recommendation: ${data.recommendation}`;
        document.getElementById("flag").style.background = flagBg;

        let html = `
          <div class="card"><h4>Company Summary</h4>${data.company_summary}</div>
          <div class="card"><h4>Key Financials</h4><ul>${data.key_financials.map(i => `<li>${i}</li>`).join("")}</ul></div>
          <div class="card"><h4>Growth Trends</h4><ul>${data.growth_trends.map(i => `<li>${i}</li>`).join("")}</ul></div>
          <div class="card strengths"><h4>Strengths</h4><ul>${data.strengths.map(i => `<li>${i}</li>`).join("")}</ul></div>
          <div class="card risks"><h4>Risks</h4><ul>${data.risks.map(i => `<li>${i}</li>`).join("")}</ul></div>
          <div class="card"><h4>Quick Summary</h4>${data.quick_summary}</div>
        `;
        document.getElementById("result").innerHTML = html;

      } else {
        document.getElementById("result").innerText = "❌ Invalid response from server.";
      }
    })
    .catch(err => {
      loader.style.display = "none";
      console.error("Request failed:", err);
      document.getElementById("result").innerText = "❌ Request failed: " + err;
    });
  });
});
