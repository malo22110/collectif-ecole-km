import os
from pypdf import PdfReader

folder = 'doc/Sources/Projet collectif/Pv municipaux'
output_file = 'public/context.txt'

with open(output_file, 'w') as f:
    f.write("CONTEXTE : PROCÈS VERBAUX DU CONSEIL MUNICIPAL DE KERGRIST-MOËLOU\n\n")
    for filename in sorted(os.listdir(folder)):
        if not filename.endswith('.pdf'):
            continue
        path = os.path.join(folder, filename)
        f.write(f"\n\n--- DEBUT DU DOCUMENT : {filename} ---\n\n")
        try:
            reader = PdfReader(path)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    f.write(text + "\n")
        except Exception as e:
            print(f"Error {filename}: {e}")
        f.write(f"\n--- FIN DU DOCUMENT : {filename} ---\n")

print("Context generated.")
