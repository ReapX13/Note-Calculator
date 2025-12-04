 // Small JS: search, sort by column header click, export CSV, reset
      (function () {
        const table = document.getElementById("gradesTable");
        const tbody = table.tBodies[0];
        const search = document.getElementById("search");
        const exportBtn = document.getElementById("exportBtn");
        const resetBtn = document.getElementById("resetBtn");

        // Subject data with coefficients
        const subjects = [
          { name: "MATH", coef: 9, prefix: "math" },
          { name: "PC", coef: 7, prefix: "pc" },
          { name: "SVT", coef: 3, prefix: "svt" },
          { name: "FR", coef: 4, prefix: "fr" },
          { name: "AR", coef: 2, prefix: "ar" },
          { name: "HG", coef: 2, prefix: "hg" },
          { name: "EI", coef: 2, prefix: "ei" },
          { name: "PH", coef: 2, prefix: "ph" },
          { name: "EN", coef: 2, prefix: "en" },
          { name: "EPS", coef: 1, prefix: "eps" },
          { name: "AC", coef: 1, prefix: "ac" },
        ];

        // Calculate subject total
        function calculateSubjectTotal(prefix) {
          // AC (Activities Culturelles) only has one grade
          if (prefix === "ac") {
            const c1Input = document.querySelector(`.${prefix}-c1-input`);
            const c1Value = c1Input?.value === "" ? 0 : parseFloat(c1Input?.value) || 0;
            const totalEl = document.querySelector(`.${prefix}-total`);
            if (totalEl) totalEl.textContent = c1Value.toFixed(2);
            return c1Value;
          }

          // All other subjects have 5 grades
          const c1Input = document.querySelector(`.${prefix}-c1-input`);
          const c2Input = document.querySelector(`.${prefix}-c2-input`);
          const c3Input = document.querySelector(`.${prefix}-c3-input`);
          const c4Input = document.querySelector(`.${prefix}-c4-input`);
          const acInput = document.querySelector(`.${prefix}-ac-input`);

          // Check if at least one field has a value
          const hasAnyValue = c1Input?.value !== "" || c2Input?.value !== "" || c3Input?.value !== "" || c4Input?.value !== "" || acInput?.value !== "";

          const c1 = c1Input?.value === "" ? (hasAnyValue ? 20 : 0) : parseFloat(c1Input?.value) || 0;
          const c2 = c2Input?.value === "" ? (hasAnyValue ? 20 : 0) : parseFloat(c2Input?.value) || 0;
          const c3 = c3Input?.value === "" ? (hasAnyValue ? 20 : 0) : parseFloat(c3Input?.value) || 0;
          const c4 = c4Input?.value === "" ? (hasAnyValue ? 20 : 0) : parseFloat(c4Input?.value) || 0;
          const ac = acInput?.value === "" ? (hasAnyValue ? 20 : 0) : parseFloat(acInput?.value) || 0;

          const total = (c1 + c2 + c3 + c4 + ac) / 5;
          const totalEl = document.querySelector(`.${prefix}-total`);
          if (totalEl) totalEl.textContent = total.toFixed(2);

          return total;
        }

        // Calculate grand total
        function calculateGrandTotal() {
          let weightedSum = 0;
          let totalCoef = 0;

          subjects.forEach((subject) => {
            const total = calculateSubjectTotal(subject.prefix);
            weightedSum += total * subject.coef;
            totalCoef += subject.coef;
          });

          const grandTotal = totalCoef > 0 ? weightedSum / totalCoef : 0;
          const grandTotalEl = document.querySelector(".TTotal");
          if (grandTotalEl) grandTotalEl.textContent = grandTotal.toFixed(2);
        }

        // Add event listeners to all inputs
        document.querySelectorAll(".notes-inputs").forEach((input) => {
          input.addEventListener("input", calculateGrandTotal);
        });

        // Search/filter
        search.addEventListener("input", () => {
          const q = search.value.trim().toLowerCase();
          Array.from(tbody.rows).forEach((row) => {
            const subject = row.cells[0].textContent.toLowerCase();
            if (!q || subject.includes(q)) row.style.display = "";
            else row.style.display = "none";
          });
        });

        // Export visible rows to CSV
        function downloadCSV(filename, text) {
          const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
          }, 100);
        }
        exportBtn.addEventListener("click", async () => {
          const tableWrap = document.querySelector(".table-wrap");
          const canvas = await html2canvas(tableWrap, {
            backgroundColor: "#0f1724",
            scale: 2,
            useCORS: true,
          });
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "notes_export.png";
          document.body.appendChild(link);
          link.click();
          link.remove();
        });
        // Reset filter
        resetBtn.addEventListener("click", () => {
          search.value = "";
          Array.from(tbody.rows).forEach((r) => (r.style.display = ""));
          document.querySelectorAll(".notes-inputs").forEach((input) => {
            input.value = "";
          });
          calculateGrandTotal();
        });

        // Sort table by clicking header
        let sortState = { index: null, dir: 1 };
        const headers = Array.from(table.tHead.querySelectorAll("th"));
        headers.forEach((th, index) => {
          th.style.cursor = "pointer";
          th.addEventListener("click", () => {
            const key = th.getAttribute("data-key") || index;
            if (sortState.index === index) sortState.dir *= -1;
            else {
              sortState.index = index;
              sortState.dir = 1;
            }
            const rows = Array.from(tbody.rows);
            rows.sort((a, b) => {
              let A = a.cells[index]?.textContent.trim() ?? "";
              let B = b.cells[index]?.textContent.trim() ?? "";
              const numeric = ["coef", "td", "tp", "exam", "final"];
              if (numeric.includes(key.toString())) {
                A = parseFloat(A.replace(",", ".")) || 0;
                B = parseFloat(B.replace(",", ".")) || 0;
                return (A - B) * sortState.dir;
              }
              return (
                A.localeCompare(B, undefined, { numeric: true }) * sortState.dir
              );
            });
            rows.forEach((r) => tbody.appendChild(r));
          });
        });
      })();