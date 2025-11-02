[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXX.svg)](https://doi.org/10.5281/zenodo.XXXXXXX)

# 🕉️ ShlokaAI: The Smart Sanskrit Analysis Platform

**ShlokaAI** is a citable, open-source piece of **research software** designed for **BAMS students, researchers, and developers** in the field of **Digital Ayurveda**.

This is not just a dataset — it is an **interactive web tool** that allows you to:

1. **Build Custom “Concept Maps”** using Ayurvedic principles (like Doshas, Dhatus, Gunas) and their Sanskrit/IAST synonyms.
2. **Paste or Upload** raw Sanskrit text (e.g., a chapter from a Samhita).
3. **Automatically Analyze & Classify** every shloka, scoring it against your concept map.
4. **Explore the Results** in an interactive dashboard, a filterable table, and a “shloka context” modal.
5. **Export** your classified, ready-to-use data as a `CSV` or `JSON` file.

This tool bridges the gap between **classical Ayurvedic texts** and **modern data analysis**.

---

## 🌟 Key Features

* **Smart Concept Mapping:** Create your own “keyword map” in JSON. Add concepts like “Vata Dosha” and its synonyms (`वात`, `वायु`, `vata`, `vayu`).
* **Template Library:** Instantly load pre-built concept maps for **Doshas**, **Dhatus**, **Gunas**, **Rasas**, **Malas**, and more.
* **Bilingual Interface:** Fully functional in both **English** and **Hindi (हिन्दी)**.
* **Text & File Input:** Paste raw text directly or upload a `.txt` file for analysis.
* **Save/Load Maps:** Save your custom-built concept maps to a `.json` file and load them later.
* **Interactive Dashboard:** Automatically generates summary cards and a pie chart to visualize the distribution of concepts.
* **Filterable Results Table:** Displays every shloka with its top concept, all scores, word/char count, and highlighted keywords.
* **Shloka Context Modal:** Click any shloka to see it in a popup with its preceding and succeeding shlokas.
* **Data Export:** Download your complete, filtered analysis as `.csv` for Excel or `.json` for developers.

---

## 💾 Data Structure Example

### 1️⃣ Input Concept Map (`concept_map.json`)

```json
{
  "Vata Dosha": ["वात", "वायु", "vata", "vayu"],
  "Pitta Dosha": ["पित्त", "अग्नि", "pitta", "agni"],
  "Kapha Dosha": ["कफ", "श्लेष्म", "kapha"]
}
```

### 2️⃣ Output Data (`shloka_export.json`)

```json
[
  {
    "id": 1,
    "shloka": "वातपित्तश्लेष्माण एव देहसम्भवहेतवः।",
    "highlighted_shloka": "<mark>वात</mark><mark>पित्त</mark><mark>श्लेष्माण</mark> एव देहसम्भवहेतवः।",
    "top_concept": "Vata Dosha, Pitta Dosha, Kapha Dosha",
    "all_scores": "Vata Dosha: 1, Pitta Dosha: 1, Kapha Dosha: 1",
    "char_count": 35,
    "word_count": 4,
    "shloka_before": null,
    "shloka_after": "..."
  }
]
```

---

## 🚀 How to Use

🔗 **Live Tool:** [https://www.amidhaayurveda.com/p/shloka-ai.html](https://www.amidhaayurveda.com/p/shloka-ai.html)

**Step 1:** Load a template (e.g., “Doshas”) or create your own concept map.
**Step 2:** Paste Sanskrit text into the input box.
**Step 3:** Click “Start Analysis.”
**Step 4:** Explore results on the dashboard and in the table. Click any row to read the shloka in context.
**Step 5:** Export your results as `.csv` or `.json`.

---

## 📖 How to Cite

> Varshney, S. (2025). *ShlokaAI: The Smart Sanskrit Analysis Platform* (Version 1.0.0) [Software]. Zenodo.
> [https://doi.org/10.5281/zenodo.XXXXXXX](https://doi.org/10.5281/zenodo.XXXXXXX)

🪶 **Note:**
Once you publish this project on Zenodo, replace the `XXXXXXX` with your assigned DOI number in both the badge and the citation.

---

## 📚 Related Projects

* **Amidha Ayurveda Herb Database** – [DOI: 10.5281/zenodo.17475352](https://doi.org/10.5281/zenodo.17475352)
* **Siddhanta Kosha** – [DOI: 10.5281/zenodo.17481343](https://doi.org/10.5281/zenodo.17481343)

---

## 👨‍💻 About the Author

**Developed by:** *Sparsh Varshney* (Founder, Amidha Ayurveda)
Contributing to open-source Digital Ayurveda projects.

🌐 **Website:** [amidhaayurveda.com/p/about.html](https://www.amidhaayurveda.com/p/about.html)
🆔 **ORCID:** [https://orcid.org/0009-0004-7835-0673](https://orcid.org/0009-0004-7835-0673)
💼 **LinkedIn:** [linkedin.com/in/sparshvarshney](https://linkedin.com/in/sparshvarshney)

---

## 📄 License

**Creative Commons Attribution 4.0 International (CC BY 4.0)**

You are free to:

* **Share** — copy and redistribute the material in any medium or format
* **Adapt** — remix, transform, and build upon the material for any purpose, even commercially

**Under the following terms:**

* **Attribution** — You must give appropriate credit (cite the DOI and link to this repository) and indicate if changes were made.
