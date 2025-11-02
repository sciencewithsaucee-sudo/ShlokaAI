[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17506828.svg)](https://doi.org/10.5281/zenodo.17506828)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC--BY--4.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
![Open Source](https://badgen.net/badge/status/open%20source/green)
![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)

# 🕉️ ShlokaAI: The Smart Sanskrit Analysis Platform

**ShlokaAI** is a citable, open-source piece of **research software** designed for **BAMS students, researchers, and developers** in the field of **Digital Ayurveda**.

This is not just a dataset — it is an **interactive web tool** that bridges the gap between classical Ayurvedic texts and modern data analysis. It allows you to build custom "Concept Maps" (e.g., for Doshas, Dhatus, Gunas), analyze raw Sanskrit text against your map, and explore the results in an interactive dashboard. You can then export your classified, ready-to-use data as `CSV` or `JSON`.

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

* **Step 1:** Load a template (e.g., “Doshas”) or create your own concept map.
* **Step 2:** Paste Sanskrit text into the input box.
* **Step 3:** Click “Start Analysis.”
* **Step 4:** Explore results on the dashboard and in the table. Click any row to read the shloka in context.
* **Step 5:** Export your results as `.csv` or `.json`.

---

## 📖 How to Cite

If you use this software in your research, please cite it. This helps support the project.

**Plain Text Citation:**

> Varshney, S. (2025). *ShlokaAI: The Smart Sanskrit Analysis Platform (Version 1.0.0)* [Software]. Zenodo.
> [https://doi.org/10.5281/zenodo.17506828](https://doi.org/10.5281/zenodo.17506828)

**BibTeX (for researchers):**

```bibtex
@software{varshney_sparsh_2025_17506828,
  author       = {Varshney, Sparsh},
  title        = {{ShlokaAI: The Smart Sanskrit Analysis Platform}},
  month        = nov,
  year         = 2025,
  publisher    = {Zenodo},
  version      = {1.0.0},
  doi          = {10.5281/zenodo.17506828},
  url          = {https://doi.org/10.5281/zenodo.17506828}
}
```

---

## 🤝 Contributing & Support

This is a community project — **contributions are welcome!**

* 🐞 **Found a bug?** Report it as an [Issue](../../issues).
* 💡 **Have an idea?** Suggest a new feature.
* 🔧 **Want to help?** Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

**Community Rules:**
Please follow our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 📚 Related Projects

* **Amidha Ayurveda Herb Database** – [DOI: 10.5281/zenodo.17475352](https://doi.org/10.5281/zenodo.17475352)
* **Siddhanta Kosha** – [DOI: 10.5281/zenodo.17481343](https://doi.org/10.5281/zenodo.17481343)

---

## 👨‍💻 About the Author

**Developed by:** *Sparsh Varshney* (Founder, Amidha Ayurveda)
Contributing to open-source Digital Ayurveda projects.

* 🌐 **Website:** [amidhaayurveda.com/p/about.html](https://www.amidhaayurveda.com/p/about.html)
* 🆔 **ORCID:** [https://orcid.org/0009-0004-7835-0673](https://orcid.org/0009-0004-7835-0673)
* 💼 **LinkedIn:** [linkedin.com/in/sparshvarshney](https://linkedin.com/in/sparshvarshney)

---

## 📄 License

This project is licensed in two parts:

**Software Code:** All code in this repository (e.g., .js, .html, .css files) is licensed under the [MIT License](https://opensource.org/license/MIT). This makes the code open and reusable while limiting liability.

**Documentation & Content:** All documentation (like this README.md) and data files are licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0). This ensures you must give appropriate credit (cite the DOI) when using this work.
