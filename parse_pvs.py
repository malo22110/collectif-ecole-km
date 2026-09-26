import os
import re
from pypdf import PdfReader

folder = 'data/pv_municipaux'
keywords = ['école', 'ecole', 'rénovation', 'renovation', 'budget', 'euro', '€', 'travaux', 'maîtrise d', 'maitrise d', 'architecte']

results = []

for filename in sorted(os.listdir(folder)):
    if not filename.endswith('.pdf'):
        continue
        
    path = os.path.join(folder, filename)
    try:
        reader = PdfReader(path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        
        # Split into paragraphs or chunks
        paragraphs = text.split('\n\n')
        if len(paragraphs) < 5:
            paragraphs = text.split('.') # fallback
            
        found_ecole = False
        relevant_text = []
        for p in paragraphs:
            p_lower = p.lower()
            if 'ecole' in p_lower or 'école' in p_lower or 'groupe scolaire' in p_lower:
                if any(kw in p_lower for kw in ['travaux', 'renovation', 'rénovation', 'euro', '€', 'subvention', 'marché', 'marche', 'architecte']):
                    relevant_text.append(p.strip().replace('\n', ' '))
                    
        if relevant_text:
            results.append((filename, relevant_text))
    except Exception as e:
        print(f"Error reading {filename}: {e}")

with open('data/pv_municipaux/analysis.md', 'w') as f:
    for filename, texts in results:
        f.write(f"### {filename}\n")
        for t in texts:
            f.write(f"- {t}\n\n")

print("Done. Wrote to data/pv_municipaux/analysis.md")
