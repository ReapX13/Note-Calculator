// Small JS: search, sort by column header click, export CSV, reset
      (function () {
        const table = document.getElementById("gradesTable");
        const tbody = table.tBodies[0];
        const search = document.getElementById("search");
        const exportBtn = document.getElementById("exportBtn");
        const resetBtn = document.getElementById("resetBtn");

        // Subject data with coefficients for Tronc Commun Sciences Français
        const subjects = [
          { name: "MATH", coef: 5, prefix: "math" },
          { name: "PC", coef: 4, prefix: "pc" },
          { name: "SVT", coef: 3, prefix: "svt" },
          { name: "FR", coef: 3, prefix: "fr" },
          { name: "AR", coef: 2, prefix: "ar" },
          { name: "HG", coef: 2, prefix: "hg" },
          { name: "EI", coef: 2, prefix: "ei" },
          { name: "EPS", coef: 1, prefix: "eps" },
          { name: "PH", coef: 2, prefix: "ph" },
          { name: "EN", coef: 2, prefix: "en" },
          { name: "INF", coef: 2, prefix: "inf" },
          { name: "AC", coef: 1, prefix: "ac" },
        ];

        // Calculate subject total
        function calculateSubjectTotal(prefix) {
          // AC (Activities Culturelles) only has one grade
          if (prefix === "ac") {
            const acInput = document.querySelector(`.${prefix}-c1-input`);
            const acVal = acInput && acInput.value !== "" ? (parseFloat(acInput.value) || 0) : null;
            const totalEl = document.querySelector(`.${prefix}-total`);
            if (totalEl) totalEl.textContent = acVal !== null ? acVal.toFixed(2) : "0.00";
            return acVal;
          }

          // All other subjects: average only non-empty inputs
          const inputs = [
            document.querySelector(`.${prefix}-c1-input`),
            document.querySelector(`.${prefix}-c2-input`),
            document.querySelector(`.${prefix}-c3-input`),
            document.querySelector(`.${prefix}-c4-input`),
            document.querySelector(`.${prefix}-ac-input`),
          ];

          let sum = 0;
          let count = 0;
          inputs.forEach((inp) => {
            if (inp && inp.value !== "") {
              const v = parseFloat(inp.value);
              sum += isNaN(v) ? 0 : v;
              count += 1;
            }
          });

          const total = count > 0 ? sum / count : 0;
          const totalEl = document.querySelector(`.${prefix}-total`);
          if (totalEl) totalEl.textContent = count > 0 ? total.toFixed(2) : "0.00";

          return count > 0 ? total : null;
        }

        // Calculate grand total (include all subjects; empty subjects count as 0)
        function calculateGrandTotal() {
          let weightedSum = 0;
          let totalCoef = 0;

          subjects.forEach((subject) => {
            const total = calculateSubjectTotal(subject.prefix);
            const t = total === null ? 0 : total;
            weightedSum += t * subject.coef;
            totalCoef += subject.coef;
          });

          const grandTotal = totalCoef > 0 ? weightedSum / totalCoef : 0;
          const grandTotalEl = document.querySelector(`.TTotal`);
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
          const body = document.body;
          const tableWrap = document.querySelector(".table-wrap");
          const table = document.querySelector("#gradesTable");
          
          // Save original styles
          const originalBodyOverflow = body.style.overflow;
          const originalTableWrapOverflow = tableWrap.style.overflow;
          const originalTableMinWidth = table.style.minWidth;
          
          // Calculate proper dimensions
          const tableWidth = table.scrollWidth;
          const tableHeight = tableWrap.scrollHeight;
          
          // Temporarily adjust styles
          body.style.overflow = "visible";
          tableWrap.style.overflow = "visible";
          table.style.minWidth = "0";
          
          try {
            const canvas = await html2canvas(tableWrap, {
              backgroundColor: "#0f1724",
              scale: 2,
              useCORS: true,
              allowTaint: true,
              scrollX: 0,
              scrollY: 0,
              windowHeight: Math.max(tableHeight, 800),
              windowWidth: Math.max(tableWidth, 1200),
            });
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "notes_export.png";
            document.body.appendChild(link);
            link.click();
            link.remove();
          } finally {
            // Restore original styles
            body.style.overflow = originalBodyOverflow;
            tableWrap.style.overflow = originalTableWrapOverflow;
            table.style.minWidth = originalTableMinWidth;
          }
        });
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